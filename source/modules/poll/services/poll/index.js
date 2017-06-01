const R = require('ramda');
const pollRepository = require('../../repositories/poll');
const pollVoteRepository = require('../../repositories/poll-vote');
const impl = require('./implementation');

/**
 * @module modules/POLL/services/poll
 */

const logger = require('../../../../shared/services/logger')('POLL/service/poll');

const addResultToPoll = R.curry((poll, results) => {
  const result = results[poll.id] ? R.pluck('optionId', results[poll.id]) : null;

  return R.assoc('voteResult', result, poll);
});

const list = async (payload, message) => {
  logger.debug('Finding multiple polls', { payload, message });

  let promises;

  if (payload.constraint) {
    const polls = await pollRepository.findBy(payload.constraint);

    promises = [
      Promise.resolve(polls),
      pollVoteRepository.findBy({ pollId: { $in: R.pluck('id', polls) }, userId: message.credentials.id }),
    ];
  } else {
    promises = [
      pollRepository.findBy({ id: { $in: payload.pollIds } }),
      pollVoteRepository.findBy({
        pollId: { $in: payload.pollIds },
        userId: message.credentials.id,
      }),
    ];
  }

  const [polls, votes] = await Promise.all(promises);
  const resultsByPoll = R.groupBy(R.prop('pollId'), votes);

  return R.map(addResultToPoll(R.__, resultsByPoll), polls);
};

/**
 * Gets a poll
 * @param {object} payload - Object containing payload data
 * @param {string} payload.pollId - Id of the poll to get
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method get
 * @return {external:Promise.<Poll>}
 */
const get = async (payload, message) => {
  logger.debug('Finding poll', { payload, message });

  const promises = [
    pollRepository.findById(payload.pollId),
    pollVoteRepository.findBy({ pollId: payload.pollId, userId: message.credentials.id }),
  ];

  const [poll, votes] = await Promise.all(promises);
  const result = votes.length ? R.pluck('optionId', votes) : null;

  return R.assoc('voteResults', result, poll);
};

/**
 * Creates a poll
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - Id of the message the poll is placed in
 * @param {array} payload.options - Poll options to create
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Poll>}
 */
const create = async (payload, message) => {
  logger.debug('Creating poll', { payload, message });

  const poll = await pollRepository.create({
    messageId: payload.messageId,
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
const vote = async (payload, message) => {
  logger.debug('Voting on poll', { payload, message });

  // await impl.assertThatPollExistsAndUserHasPermission(payload.networkId, payload.pollId);
  await pollRepository.clearVotes(payload.pollId, message.credentials.id);

  const voteForOption = (optionId) => pollRepository.vote({
    optionId, pollId: payload.pollId, userId: message.credentials.id });

  await Promise.all(R.map(voteForOption, payload.optionIds));

  const poll = await pollRepository.findById(payload.pollId);
  poll.voteResult = payload.optionIds;

  return poll;
};

exports.create = create;
exports.get = get;
exports.list = list;
exports.vote = vote;
