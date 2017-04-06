const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  organisationId: dataModel.organisationId,
  userId: dataModel.userId,
  functionId: dataModel.functionId,
  roleType: dataModel.roleType,
  createdAt: dateUtils.toISOString(dataModel.created_at),
  updatedAt: dateUtils.toISOString(dataModel.updated_at),
});
