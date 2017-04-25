const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  organisationId: dataModel.organisationId ? dataModel.organisationId.toString() : null,
  userId: dataModel.userId,
  functionId: dataModel.functionId,
  roleType: dataModel.roleType,
  invitedAt: dateUtils.toISOString(dataModel.invitedAt),
  deletedAt: dataModel.deletedAt,
  externalId: dataModel.externalId,
  createdAt: dateUtils.toISOString(dataModel.created_at),
  updatedAt: dateUtils.toISOString(dataModel.updated_at),
});
