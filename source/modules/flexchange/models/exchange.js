import * as dateUtils from '../../../shared/utils/date';

export default (dao) => ({
  type: 'exchange',
  id: dao.id.toString(),
  userId: dao.userId.toString(),
  description: dao.description,
  date: dateUtils.toISOString(dao.date),
  startTime: dao.startTime ? dateUtils.toISOString(dao.startTime) : null,
  endTime: dao.endTime ? dateUtils.toISOString(dao.endTime) : null,
  acceptCount: dao.acceptCount,
  declineCount: dao.declineCount,
  approvedById: dao.approvedBy ? dao.approvedBy.toString() : null,
  approvedUserId: dao.approvedUserId ? dao.approvedUserId.toString() : null,
  createdAt: dateUtils.toISOString(dao.created_at),
});
