const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  id: dataModel.id,
  workflowId: dataModel.workflowId,
  type: dataModel.type,
  meta: dataModel.meta ? JSON.parse(dataModel.meta) : null,
  createdAt: dateUtils ? dateUtils.toISOString(dataModel.created_at) : null,
  updatedAt: dateUtils ? dateUtils.toISOString(dataModel.updated_at) : null,
});
