const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  id: dataModel.id.toString(),
  userId: dataModel.userId.toString(),
  objectId: dataModel.objectId.toString(),
  createdAt: dateUtils.toISOString(dataModel.created_at)
});
