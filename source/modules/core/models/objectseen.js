const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => {
  // In this case, it is a grouped view and has a different layout
  if (!dataModel.id) {
    return {
      objectId: dataModel.objectId.toString(),
      seenCount: dataModel.dataValues.seenCount || 0
    };
  }

  return {
    id: dataModel.id.toString(),
    userId: dataModel.userId.toString(),
    objectId: dataModel.objectId.toString(),
    createdAt: dateUtils.toISOString(dataModel.created_at)
  };
};
