const R = require('ramda');
const dateUtils = require('../../../shared/utils/date');

export default (dao) => ({
  type: 'team',
  id: dao.id.toString(),
  networkId: dao.networkId.toString(),
  externalId: dao.externalId ? dao.externalId.toString() : null,
  name: dao.name,
  description: dao.description || null,
  memberCount: dao.Users ? dao.Users.length : 0,
  memberIds: dao.Users ? R.map(R.pipe(R.prop('id'), R.toString), dao.Users) : [],
  isMember: !!dao.isMember,
  isSynced: !!dao.externalId,
  isChannel: !!dao.isChannel,
  createdAt: dateUtils.toISOString(dao.created_at),
});
