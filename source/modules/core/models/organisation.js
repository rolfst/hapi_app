const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  type: 'organisation',
  id: dataModel.id.toString(),
  name: dataModel.name,
  brandIcon: dataModel.brandIcon,
  createdAt: dateUtils.toISOString(dataModel.created_at),
  updatedAt: dateUtils.toISOString(dataModel.updated_at),
});
