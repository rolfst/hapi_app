const dateUtils = require('../../../shared/utils/date');

module.exports = (dao) => ({
  type: 'exchange_comment',
  id: dao.id.toString(),
  exchangeId: dao.exchangeId.toString(),
  text: dao.text,
  createdAt: dateUtils.toISOString(dao.created_at),
});
