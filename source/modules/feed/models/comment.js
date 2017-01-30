import * as dateUtils from '../../../shared/utils/date';

export default (dao) => ({
  id: dao.id.toString(),
  userId: dao.userId.toString(),
  messageId: dao.messageId.toString(),
  text: dao.text || null,
  createdAt: dateUtils.toISOString(dao.created_at),
});
