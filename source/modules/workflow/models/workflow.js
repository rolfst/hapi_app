const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  id: dataModel.id,
  organisationId: dataModel.organisationId,
  name: dataModel.name,
  meta: dataModel.meta ? JSON.parse(dataModel.meta) : null,
  createdAt: dateUtils ? dateUtils.toISOString(dataModel.created_at) : null,
  updatedAt: dateUtils ? dateUtils.toISOString(dataModel.updated_at) : null,
});
