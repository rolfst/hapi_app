const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => {
  if (!dataModel) return null;

  return {
    id: dataModel.id,
    organisationId: parseInt(dataModel.organisationId, 10), // Somehow the dao gives a string
    name: dataModel.name,
    meta: dataModel.meta ? JSON.parse(dataModel.meta) : null,
    startDate: dataModel.start_date ? dateUtils.toISOString(dataModel.start_date) : null,
    expirationDate: dataModel.expiration_date
      ? dateUtils.toISOString(dataModel.expiration_date)
      : null,
    lastCheck: dataModel.lastCheck ? dateUtils.toISOString(dataModel.lastCheck) : null,
    createdAt: dataModel.created_at ? dateUtils.toISOString(dataModel.created_at) : null,
    updatedAt: dataModel.updated_at ? dateUtils.toISOString(dataModel.updated_at) : null,
    done: !!dataModel.done,
    triggers: null, // Set in service
    conditions: null, // Set in service
    actions: null, // Set in service
  };
};
