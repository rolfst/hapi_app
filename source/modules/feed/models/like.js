const dateUtils = require('../../../shared/utils/date');

export default (dao) => ({
  id: dao.id.toString(),
  messageId: dao.messageId.toString(),
  userId: dao.userId.toString(),
  createdAt: dateUtils.toISOString(dao.created_at),
});
