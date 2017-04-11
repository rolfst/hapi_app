const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  id: dataModel.id,
  organisationId: dataModel.organisationId,
  name: dataModel.name,
  createdAt: dateUtils ? dateUtils.toISOString(dataModel.created_at) : null,
});
