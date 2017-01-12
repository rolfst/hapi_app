import * as dateUtils from '../../../../shared/utils/date';

export default (dao) => ({
  type: 'conversation_message',
  id: dao.id.toString(),
  conversationId: dao.parentId.toString(),
  text: dao.text,
  userId: dao.createdBy.toString(),
  createdAt: dateUtils.toISOString(dao.created_at),
});
