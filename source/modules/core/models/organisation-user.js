const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  organisationId: dataModel.organisationId ? dataModel.organisationId.toString() : null,
  userId: dataModel.userId,
  functionId: dataModel.functionId,
  roleType: dataModel.roleType,
  invitedAt: dataModel.invitedAt ? dateUtils.toISOString(dataModel.invitedAt) : null,
  deletedAt: dataModel.deletedAt ? dateUtils.toISOString(dataModel.deletedAt) : null,
  externalId: dataModel.externalId,
  lastActive: dataModel.lastActive ? dateUtils.toISOString(dataModel.lastActive) : null,
  createdAt: dateUtils.toISOString(dataModel.created_at),
  updatedAt: dateUtils.toISOString(dataModel.updated_at),
});
