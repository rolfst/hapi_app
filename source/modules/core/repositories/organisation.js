const { Organisation, OrganisationUser } = require('./dao');
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

exports.create = create;
exports.findById = findById;
exports.getPivot = getPivot;
exports.hasUser = hasUser;
exports.addUser = addUser;
