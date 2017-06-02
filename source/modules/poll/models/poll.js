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

module.exports = (dao) => ({
  type: 'poll',
  id: dao.id.toString(),
  messageId: dao.messageId ? dao.messageId.toString() : null,
  question: dao.question,
  options: dao.Options ? getOptions(dao.Options) : [],
  totalVoteCount: dao.Options ? getUniqueVoteUsers(dao.Options).length : 0,
  voteResult: dao.voteResult || null,
  createdAt: dateUtils.toISOString(dao.created_at),
});
