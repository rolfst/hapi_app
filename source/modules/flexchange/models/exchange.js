const dateUtils = require('../../../shared/utils/date');

module.exports = (dao) => ({
  type: 'exchange',
  id: dao.id.toString(),
  networkId: dao.networkId.toString(),
  userId: dao.userId.toString(),
  teamId: dao.teamId ? dao.teamId.toString() : null,
  shiftId: dao.shiftId ? dao.shiftId.toString() : null,
  createdFor: dao.type || null,
  responseStatus: null, // Will be set by business logic
  date: dateUtils.toISOString(dao.date),
  startTime: dao.startTime ? dateUtils.toISOString(dao.startTime) : null,
  endTime: dao.endTime ? dateUtils.toISOString(dao.endTime) : null,
  title: dao.title,
  description: dao.description || null,
  acceptCount: dao.acceptCount || 0,
  declineCount: dao.declineCount || 0,
  isApproved: !!dao.approvedUserId,
  approvedById: dao.approvedBy ? dao.approvedBy.toString() : null,
  approvedUserId: dao.approvedUserId ? dao.approvedUserId.toString() : null,
  createdAt: dateUtils.toISOString(dao.created_at),
});
