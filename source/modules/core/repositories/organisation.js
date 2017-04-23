const R = require('ramda');
const { Organisation, OrganisationUser, OrganisationNetwork, OrganisationFunction } = require('./dao');
const createModel = require('../models/organisation');
const createPivotModel = require('../models/organisation-user');
const createFunctionsModel = require('../models/organisation-function');

const create = (attributes) => Organisation
  .create(attributes)
  .then(createModel);

const findById = (organisationId) => Organisation
  .findById(organisationId)
  .then((result) => {
    if (!result) return null;

    return createModel(result);
  });

const findForUser = async (userId) => {
  const pivotResult = await OrganisationUser.findAll({
    where: { userId },
  });

  const organisationResult = await Organisation.findAll({
    where: { id: { $in: R.pluck('organisationId', pivotResult) } },
  });

  return R.map(createModel, organisationResult);
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

const addUser = async (userId, organisationId, roleType = 'EMPLOYEE', functionId = null) => {
  return OrganisationUser
    .create({
      userId,
      organisationId,
      organisation_id: organisationId,
      roleType,
      functionId,
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
  return OrganisationUser.update(attributes, { where: { organisationId, userId } })
    .then(createPivotModel);
}

exports.addFunction = addFunction;
exports.addUser = addUser;
exports.attachNetwork = attachNetwork;
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
exports.updateUser = updateUser;
