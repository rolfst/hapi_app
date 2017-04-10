const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  id: dataModel.id,
  organisationId: dataModel.organisationId,
  name: dataModel.name,
  createdAt: dateUtils.toISOString(dataModel.updated_at),
});
