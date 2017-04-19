const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => {
  if (!dataModel) return null;

  return {
    id: dataModel.id,
    workflowId: dataModel.workflowId,
    type: dataModel.type,
    value: dataModel.value,
    createdAt: dataModel.created_at ? dateUtils.toISOString(dataModel.created_at) : null,
    updatedAt: dataModel.updated_at ? dateUtils.toISOString(dataModel.updated_at) : null,
  };
};
