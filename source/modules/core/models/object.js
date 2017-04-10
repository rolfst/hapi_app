const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  id: dataModel.id.toString(),
  userId: dataModel.userId.toString(),
  objectType: dataModel.objectType,
  sourceId: dataModel.sourceId.toString(),
  parentType: dataModel.parentType,
  parentId: dataModel.parentId.toString(),
  createdAt: dateUtils.toISOString(dataModel.created_at),
  seen: false, // Filled in object repo
  seenCount: null // Filled in object repo
});
