const R = require('ramda');
const { Organisation, OrganisationUser, OrganisationNetwork } = require('./dao');
const createModel = require('../models/organisation');
const createPivotModel = require('../models/organisation-user');

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
  return OrganisationUser.create({
    userId, organisationId, organisation_id: organisationId, roleType, functionId,
  });
};

const attachNetwork = async (networkId, organisationId) => OrganisationNetwork
  .create({ networkId, organisationId });

const deleteAll = () => Organisation.findAll()
  .then((organisations) => Organisation.destroy({
    where: { id: { $in: R.pluck('id', organisations) } },
  }));

exports.create = create;
exports.findById = findById;
exports.findForUser = findForUser;
exports.getPivot = getPivot;
exports.hasUser = hasUser;
exports.addUser = addUser;
exports.attachNetwork = attachNetwork;
exports.deleteAll = deleteAll;
