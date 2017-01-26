import * as dateUtils from '../../../shared/utils/date';

export default (dataModel) => ({
  type: 'message',
  id: dataModel.id.toString(),
  objectId: dataModel.objectId ? dataModel.objectId.toString() : null,
  text: dataModel.text,
  hasLiked: dataModel.hasLiked || false,
  likesCount: dataModel.likesCount,
  commentsCount: dataModel.commentsCount,
  createdAt: dateUtils.toISOString(dataModel.created_at),
});
