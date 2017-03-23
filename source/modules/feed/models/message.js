const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  type: 'feed_message',
  id: dataModel.id.toString(),
  objectId: dataModel.objectId ? dataModel.objectId.toString() : null,
  text: dataModel.text,
  hasLiked: dataModel.hasLiked || false,
  likesCount: dataModel.likesCount,
  commentsCount: dataModel.commentsCount,
  createdAt: dateUtils.toISOString(dataModel.created_at),
});
