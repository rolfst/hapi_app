import R from 'ramda';
import * as dateUtils from '../../../shared/utils/date';
import createOptionModel from './poll-option';

const getOptions = R.pipe(
  R.sortBy(R.prop('order')),
  R.map(createOptionModel)
);

const getUniqueVoteUsers = R.pipe(
  R.pluck('Votes'),
  R.flatten,
  R.pluck('userId'),
  R.uniq
);

export default (dao) => ({
  type: 'poll',
  id: dao.id.toString(),
  createdAt: dateUtils.toISOString(dao.created_at),
  network_id: dao.networkId ? dao.networkId.toString() : null,
  user_id: dao.userId ? dao.userId.toString() : null,
  options: dao.Options ? getOptions(dao.Options) : [],
  total_vote_count: dao.Options ? getUniqueVoteUsers(dao.Options).length : 0,
});
