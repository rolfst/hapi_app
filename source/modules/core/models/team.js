import R from 'ramda';
import * as dateUtils from '../../../shared/utils/date';

export default (dao) => ({
  type: 'team',
  id: dao.id.toString(),
  networkId: dao.networkId.toString(),
  externalId: dao.externalId ? dao.externalId.toString() : null,
  name: dao.name,
  description: dao.description || null,
  memberIds: dao.Users ? R.map(R.pipe(R.prop('id'), R.toString), dao.Users) : [],
  isChannel: !!dao.isChannel,
  createdAt: dateUtils.toISOString(dao.created_at),
});
