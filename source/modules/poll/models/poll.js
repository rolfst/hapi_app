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

const filterForLoggedUser = (loggedUserId) => R.filter(R.propEq('userId', loggedUserId));
const userIdsToString = R.map(R.evolve({ userId: R.toString }));
const getVoteResult = (poll, loggedUserId) => R.pipe(
  R.pluck('Votes'),
  R.flatten,
  R.pluck('dataValues'),
  userIdsToString,
  filterForLoggedUser(loggedUserId),
  R.pluck('optionId'),
  R.map(R.toString),
  R.ifElse(R.length, R.identity, R.always(null))
)(poll.Options);

export default (dao, loggedUserId) => ({
  type: 'poll',
  id: dao.id.toString(),
  networkId: dao.networkId ? dao.networkId.toString() : null,
  userId: dao.userId ? dao.userId.toString() : null,
  question: dao.question,
  options: dao.Options ? getOptions(dao.Options) : [],
  totalVoteCount: dao.Options ? getUniqueVoteUsers(dao.Options).length : 0,
  voteResult: dao.Options && loggedUserId ? getVoteResult(dao, loggedUserId) : null,
  createdAt: dateUtils.toISOString(dao.created_at),
});
