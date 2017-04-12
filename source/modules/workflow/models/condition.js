const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  id: dataModel.id,
  workflowId: dataModel.workflowId,
  field: dataModel.field,
  operator: dataModel.operator,
  value: dataModel.value,
  createdAt: dateUtils ? dateUtils.toISOString(dataModel.created_at) : null,
  updatedAt: dateUtils ? dateUtils.toISOString(dataModel.updated_at) : null,
});
