const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  id: dataModel.id,
  workflowId: dataModel.workflowId,
  userId: dataModel.userId,
  createdAt: dateUtils ? dateUtils.toISOString(dataModel.created_at) : null,
  updatedAt: dateUtils ? dateUtils.toISOString(dataModel.updated_at) : null,
});
