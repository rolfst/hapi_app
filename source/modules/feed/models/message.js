const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  type: 'feed_message',
  messageType: dataModel.messageType,
  id: dataModel.id.toString(),
  text: dataModel.text,
  hasLiked: dataModel.hasLiked || false,
  likesCount: dataModel.likesCount,
  commentsCount: dataModel.commentsCount,
  createdAt: dateUtils.toISOString(dataModel.created_at),
  createdBy: dataModel.createdBy ? dataModel.createdBy.toString() : null,
});
