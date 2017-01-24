import R from 'ramda';
import * as dateUtils from '../../../../shared/utils/date';

const toId = R.pipe(R.prop('id'), R.toString);

export default (dao) => ({
  type: 'conversation',
  id: dao.id.toString(),
  userId: dao.createdBy.toString(),
  lastMessage: null, // Will be overwritten via the service
  participantIds: dao.Users ? R.map(toId, dao.Users) : [],
  createdAt: dateUtils.toISOString(dao.created_at),
});
