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
      userId, organisationId, organisation_id: organisationId, roleType, functionId,
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

const updateFunction = (organisationFunctionIdOrWhereConstraint, name) => {
  const whereConstraint = typeof organisationFunctionIdOrWhereConstraint === 'object'
    ? organisationFunctionIdOrWhereConstraint
    : { id: organisationFunctionIdOrWhereConstraint };

  return OrganisationFunction
    .update({ name }, { where: whereConstraint });
};

const removeFunction = (organisationFunctionIdOrWhereConstraint) => {
  const whereConstraint = typeof organisationFunctionIdOrWhereConstraint === 'object'
    ? organisationFunctionIdOrWhereConstraint
    : { id: organisationFunctionIdOrWhereConstraint };

  return OrganisationFunction
    .destroy({ where: whereConstraint });
};

const findFunctionsInOrganisation = (organisationId) =>
  OrganisationFunction
    .findAll({ where: { organisationId } })
    .then(R.map(createFunctionsModel));

const findFunction = (organisationFunctionIdOrWhereConstraint) => {
  const whereConstraint = typeof organisationFunctionIdOrWhereConstraint === 'object'
    ? organisationFunctionIdOrWhereConstraint
    : { id: organisationFunctionIdOrWhereConstraint };

  return OrganisationFunction
    .findOne({ where: whereConstraint });
};

exports.create = create;
exports.findById = findById;
exports.findForUser = findForUser;
exports.getPivot = getPivot;
exports.hasUser = hasUser;
exports.addUser = addUser;
exports.attachNetwork = attachNetwork;
exports.deleteAll = deleteAll;
exports.addFunction = addFunction;
exports.updateFunction = updateFunction;
exports.removeFunction = removeFunction;
exports.findFunctionsInOrganisation = findFunctionsInOrganisation;
exports.findFunction = findFunction;
