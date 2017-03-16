const dateUtils = require('../../../shared/utils/date');

module.exports = (dao) => ({
  id: dao.id.toString(),
  userId: dao.userId.toString(),
  messageId: dao.messageId.toString(),
  text: dao.text || null,
  createdAt: dateUtils.toISOString(dao.created_at),
});
