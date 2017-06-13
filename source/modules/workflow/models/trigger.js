const moment = require('moment');
const dateUtils = require('../../../shared/utils/date');
const { ETriggerTypes } = require('../definitions');

module.exports = (dataModel) => {
  if (!dataModel) return null;

  return {
    id: dataModel.id,
    workflowId: dataModel.workflowId,
    type: dataModel.type,
    value: dataModel.type === ETriggerTypes.DATETIME && moment(dataModel.value).isValid() ?
      dateUtils.toISOString(moment.utc(dataModel.value)) : dataModel.value,
    createdAt: dataModel.created_at ? dateUtils.toISOString(dataModel.created_at) : null,
    updatedAt: dataModel.updated_at ? dateUtils.toISOString(dataModel.updated_at) : null,
  };
};
