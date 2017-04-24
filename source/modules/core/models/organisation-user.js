const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  organisationId: dataModel.organisationId.toString(),
  userId: dataModel.userId,
  functionId: dataModel.functionId,
  roleType: dataModel.roleType,
  invitedAt: dataModel.invitedAt,
  deletedAt: dataModel.deletedAt,
  externalId: dataModel.externalId,
  createdAt: dateUtils.toISOString(dataModel.created_at),
  updatedAt: dateUtils.toISOString(dataModel.updated_at),
});
