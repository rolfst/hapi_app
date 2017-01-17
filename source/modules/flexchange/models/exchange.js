import * as dateUtils from '../../../shared/utils/date';

export default (dao) => ({
  type: 'exchange',
  id: dao.id.toString(),
  description: dao.description,
  date: dateUtils.toISOString(dao.date),
  startTime: dao.startTime ? dateUtils.toISOString(dao.startTime) : null,
  endTime: dao.endTime ? dateUtils.toISOString(dao.endTime) : null,
  acceptCount: dao.acceptCount,
  declineCount: dao.declineCount,
  approvedUserId: !!dao.approvedUserId,
  createdAt: dateUtils.toISOString(dao.created_at),
});
