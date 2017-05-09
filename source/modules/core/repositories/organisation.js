const R = require('ramda');
const { Organisation, OrganisationUser, OrganisationNetwork, OrganisationFunction } = require('./dao');
const createModel = require('../models/organisation');
const createPivotModel = require('../models/organisation-user');
const createFunctionsModel = require('../models/organisation-function');
const sequelize = require('../../../shared/configs/sequelize');

const countQuery = `
SELECT
  COUNT(*) total,
  COUNT(u.last_login) loggedIn,
  COUNT(CASE WHEN NOT ou.last_active IS NULL AND ou.last_active < NOW() - INTERVAL 1 WEEK THEN 1 END) inactive
FROM
  organisation_user ou
  LEFT JOIN users u ON ou.user_id = u.id
WHERE 
  ou.organisation_id = :organisationId
  AND ou.deleted_at IS NULL
GROUP BY
  ou.organisation_id
`;

const create = (attributes) => {
  const whitelist = ['name', 'brandIcon', 'externalConfig'];

  const pickedAttributes = R.pick(whitelist, attributes);

  if (typeof pickedAttributes.externalConfig === 'object') {
    pickedAttributes.externalConfig = JSON.stringify(pickedAttributes.externalConfig);
  }

  return Organisation
    .create(pickedAttributes)
    .then(createModel);
};

const findById = (organisationId) => Organisation
  .findById(organisationId)
  .then((result) => {
    if (!result) return null;

    return createModel(result);
  });

const findForUser = async (userId, includePivot = false) => {
  const pivotResult = await OrganisationUser
  .findAll({ where: { userId } })
  .then(R.map(createPivotModel));

  const organisationResult = await Organisation
    .findAll({
      where: { id: { $in: R.pluck('organisationId', pivotResult) } },
    })
    .then(R.map(createModel));

  if (!includePivot) return organisationResult;

  const findOrganisationPivot = (organisationId) => R.find(R.propEq('id', organisationId), organisationResult);
  return R.map((organisationUser) => {
    return R.merge(organisationUser,
      R.pick(
        ['name', 'id'],
        findOrganisationPivot(organisationUser.organisationId.toString())
      )
    );
  }, pivotResult);
};

const getPivot = async (userId, organisationId) => {
  const result = await OrganisationUser.findOne({
    where: { userId, organisationId },
  });

  if (!result) return null;

  return createPivotModel(result);
};

const hasUser = async (userId, organisationId) => {
  const result = await getPivot(userId, organisationId);

  return !!result;
};

const addUser = async (userId, organisationId, roleType = 'EMPLOYEE', functionId = null, invitedAt = new Date()) => {
  return OrganisationUser
    .create({
      userId,
      organisationId,
      organisation_id: organisationId,
      roleType,
      functionId,
      invitedAt,
    });
};

const attachNetwork = async (networkId, organisationId) => OrganisationNetwork
  .create({ networkId, organisationId });

const deleteAll = () => {
  return Promise.all([
    Organisation.findAll()
      .then((organisations) => Organisation.destroy({
        where: { id: { $in: R.pluck('id', organisations) } },
      })),
    OrganisationFunction.findAll()
      .then((organisationFunctions) => OrganisationFunction.destroy({
        where: { id: { $in: R.pluck('id', organisationFunctions) } },
      })),
  ]);
};

const addFunction = (organisationId, name) => OrganisationFunction
  .create({ organisationId, name })
  .then(createFunctionsModel);

const updateFunction = (functionIdOrWhereConstraint, name) => {
  const whereConstraint = typeof functionIdOrWhereConstraint === 'object'
    ? functionIdOrWhereConstraint
    : { id: functionIdOrWhereConstraint };

  return OrganisationFunction
    .update({ name }, { where: whereConstraint });
};

const removeFunction = (functionIdOrWhereConstraint) => {
  const whereConstraint = typeof functionIdOrWhereConstraint === 'object'
    ? functionIdOrWhereConstraint
    : { id: functionIdOrWhereConstraint };

  return OrganisationFunction
    .destroy({ where: whereConstraint });
};

const findFunctionsInOrganisation = (organisationId) =>
  OrganisationFunction
    .findAll({ where: { organisationId } })
    .then(R.map(createFunctionsModel));

const findFunction = async (functionIdOrWhereConstraint) => {
  const whereConstraint = typeof functionIdOrWhereConstraint === 'object'
    ? functionIdOrWhereConstraint
    : { id: functionIdOrWhereConstraint };

  const organisationFunction = await OrganisationFunction
    .findOne({ where: whereConstraint });

  return organisationFunction
    ? createFunctionsModel(organisationFunction)
    : null;
};

/**
 * find All users by constraint
 * @param {object} constraint
 * @param {object} [attributes=object]
 * @param {object} attributes.attributes
 * @param {object} [options] - options to limit the query
 * @param {number} options.limit - options to limit the result
 * @param {number} options.offset - options to start the result cursor
 * @return {external:Promise.<user[]>}
 */
const findUsers = async (constraint, attributes = {}, options = null) => {
  if (constraint.q) {
    return sequelize.query(`
        SELECT
          organisation_user.user_id AS userId,
          organisation_user.role_type AS roleType,
          DATE_FORMAT(organisation_user.invited_at, '%Y-%m-%dT%T.000Z') AS invitedAt,
          DATE_FORMAT(organisation_user.created_at, '%Y-%m-%dT%T.000Z') AS createdAt,
          organisation_user.deleted_at AS deletedAt,
          CONCAT(users.first_name, ' ', users.last_name) AS fullName
        FROM users
        LEFT JOIN organisation_user ON users.id = organisation_user.user_id
        WHERE organisation_user.organisation_id = :organisationId
        HAVING fullName LIKE :q
      `, {
        replacements: {
          q: `%${constraint.q}%`,
          organisationId: constraint.organisationId,
        },
        type: sequelize.QueryTypes.SELECT,
      });
  }

  const query = R.merge(options, { where: constraint }, attributes);

  return OrganisationUser.findAll(query);
};

const findFunctionsForUsers = async (userId) => {
  const organisationUsers = R.map(
    createPivotModel,
    await OrganisationUser.findAll({ where: { userId } })
  );

  const functionIds = R.filter(R.complement(R.isNil()), R.map(R.prop('functionId'), organisationUsers));

  const organisationFunctions = await OrganisationFunction
    .findAll({ where: { id: { $in: functionIds } } })
    .then(R.map(createFunctionsModel));

  const findFunctionForOrganisationUser = (organisationUser) =>
    R.find(R.propEq('id', organisationUser.functionId), organisationFunctions);

  return R.map(
    (organisationUser) =>
      R.assoc('function', findFunctionForOrganisationUser(organisationUser), organisationUser),
    organisationUsers);
};

const findFunctionForUser = (userId) => {
  return R.head(findFunctionsForUsers(userId));
};

async function updateUser(userId, organisationId, attributes) {
  const whitelist = ['functionId', 'roleType', 'invitedAt', 'deletedAt', 'lastActive'];

  return OrganisationUser
    .update(R.pick(whitelist, attributes), { where: { organisationId, userId } })
    .then(() => OrganisationUser.findOne({ where: { organisationId, userId } }))
    .then(createPivotModel);
}

const updateOrganisationLink = (whereConstraint, attributes) => {
  OrganisationUser.update(attributes, { where: whereConstraint });
};

const countUsers = (organisationId) => {
  return sequelize
    .query(countQuery, {
      replacements: { organisationId },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(([{ total, inactive, loggedIn }]) => ({
      total,
      inactive,
      active: loggedIn - inactive,
      not_registered: total - loggedIn,
    }));
};

exports.addFunction = addFunction;
exports.addUser = addUser;
exports.attachNetwork = attachNetwork;
exports.countUsers = countUsers;
exports.create = create;
exports.deleteAll = deleteAll;
exports.findById = findById;
exports.findForUser = findForUser;
exports.findFunction = findFunction;
exports.findFunctionForUser = findFunctionForUser;
exports.findFunctionsForUsers = findFunctionsForUsers;
exports.findFunctionsInOrganisation = findFunctionsInOrganisation;
exports.findUsers = findUsers;
exports.getPivot = getPivot;
exports.hasUser = hasUser;
exports.removeFunction = removeFunction;
exports.updateFunction = updateFunction;
exports.updateOrganisationLink = updateOrganisationLink;
exports.updateUser = updateUser;
