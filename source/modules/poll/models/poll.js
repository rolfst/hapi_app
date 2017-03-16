const R = require('ramda');
const dateUtils = require('../../../shared/utils/date');
const createOptionModel = require('./poll-option');

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
  networkId: dao.networkId ? dao.networkId.toString() : null,
  userId: dao.userId ? dao.userId.toString() : null,
  question: dao.question,
  options: dao.Options ? getOptions(dao.Options) : [],
  totalVoteCount: dao.Options ? getUniqueVoteUsers(dao.Options).length : 0,
  createdAt: dateUtils.toISOString(dao.created_at),
});
