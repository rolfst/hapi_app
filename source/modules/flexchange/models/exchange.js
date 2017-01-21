import * as dateUtils from '../../../shared/utils/date';
import makeCreatedInObject from '../utils/created-in-text';

export default (dao) => ({
  type: 'exchange',
  id: dao.id.toString(),
  networkId: dao.networkId.toString(),
  userId: dao.userId.toString(),
  acceptCount: dao.acceptCount,
  declineCount: dao.declineCount,
  date: dao.date ? dateUtils.toISOString(dao.date) : null,
  startTime: dao.endTime ? dateUtils.toISOString(dao.startTime) : null,
  endTime: dao.endTime ? dateUtils.toISOString(dao.endTime) : null,
  description: dao.description || null,
  isApproved: !!dao.approvedUserId,
  createdIn: dao.ExchangeValues ? makeCreatedInObject(dao) : null,
  createdAt: dateUtils.toISOString(dao.created_at),
});
