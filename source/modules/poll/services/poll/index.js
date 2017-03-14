import R from 'ramda';
import * as Logger from '../../../../shared/services/logger';
import * as pollRepository from '../../repositories/poll';
import * as pollVoteRepository from '../../repositories/poll-vote';
import * as impl from './implementation';

/**
 * @module modules/POLL/services/poll
 */

const logger = Logger.getLogger('POLL/service/poll');

const addResultToPoll = R.curry((results, poll) => {
  const result = results[poll.id] ? R.pluck('optionId', results[poll.id]) : null;

  return R.assoc('voteResult', result, poll);
});

export const list = async (payload, message) => {
  logger.info('Finding multiple polls', { payload, message });

  const promises = [
    pollRepository.findBy({ id: { $in: payload.pollIds } }),
    pollVoteRepository.findBy({ pollId: { $in: payload.pollIds }, userId: message.credentials.id }),
  ];

  const [polls, votes] = await Promise.all(promises);
  const resultsByPoll = R.groupBy(R.prop('pollId'), votes);

  return R.map(addResultToPoll(resultsByPoll), polls);
};

/**
 * Gets a poll
 * @param {object} payload - Object containing payload data
 * @param {string} payload.pollId - Id of the poll to get
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method get
 * @return {external:Promise.<Poll>}
 */
export const get = async (payload, message) => {
  logger.info('Finding poll', { payload, message });

  const promises = [
    pollRepository.findById(payload.pollId),
    pollVoteRepository.findBy({ pollId: payload.pollId, userId: message.credentials.id }),
  ];

  const [poll, votes] = Promise.all(promises);
  const result = votes.length ? R.pluck('optionId', votes) : null;

  return R.assoc('voteResults', result, poll);
};

/**
 * Creates a poll
 * @param {object} payload - Object containing payload data
 * @param {string} payload.networkId - Id of the network the poll is placed in
 * @param {array} payload.options - Poll options to create
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Poll>}
 */
export const create = async (payload, message) => {
  logger.info('Creating poll', { payload, message });

  const poll = await pollRepository.create({
    networkId: payload.networkId,
    userId: message.credentials.id,
    question: payload.question,
  });

  const createOptions = R.addIndex(R.map)(impl.createOption(poll.id));
  poll.options = await Promise.all(createOptions(payload.options));

  return poll;
};

/**
 * Vote on a poll as authenticated user
 * @param {object} payload - Object containing payload data
 * @param {string} payload.networkId - Id of the current network
 * @param {string} payload.pollId - Id of the poll the user is voting on
 * @param {array} payload.optionIds - The ids op the options that the user voted for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method vote
 * @return {external:Promise.<Poll>}
 */
export const vote = async (payload, message) => {
  logger.info('Voting on poll', { payload, message });

  await impl.assertThatPollExistsAndUserHasPermission(payload.networkId, payload.pollId);
  await pollRepository.clearVotes(payload.pollId, message.credentials.id);

  const voteForOption = (optionId) => pollRepository.vote({
    optionId, pollId: payload.pollId, userId: message.credentials.id });

  await Promise.all(R.map(voteForOption, payload.optionIds));

  return pollRepository.findById(payload.pollId, message.credentials.id);
};
