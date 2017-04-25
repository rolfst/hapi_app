const dateUtils = require('../../../shared/utils/date');

module.exports = (dao) => ({
  type: 'exchange_comment',
  id: dao.id.toString(),
  exchangeId: dao.exchangeId.toString(),
  userId: dao.createdBy.toString(),
  text: dao.text,
  createdAt: dateUtils.toISOString(dao.created_at),
  user: null, // is populated in service
});
