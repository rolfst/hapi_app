const dateUtils = require('../../../shared/utils/date');

export default (dao) => ({
  type: 'exchange_response',
  id: dao.id.toString(),
  userId: dao.userId.toString(),
  exchangeId: dao.exchangeId.toString(),
  response: !!dao.response,
  isApproved: dao.approved === null ? null : !!dao.approved,
  createdAt: dateUtils.toISOString(dao.created_at),
});
