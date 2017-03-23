const R = require('ramda');
const dateUtils = require('../../../../shared/utils/date');

const toId = R.pipe(R.prop('id'), R.toString);

module.exports = (dao) => ({
  type: 'conversation',
  id: dao.id.toString(),
  userId: dao.createdBy.toString(),
  lastMessage: null, // Will be overwritten via the service
  participantIds: dao.Users ? R.map(toId, dao.Users) : [],
  createdAt: dateUtils.toISOString(dao.created_at),
  updatedAt: dateUtils.toISOString(dao.updated_at),
});
