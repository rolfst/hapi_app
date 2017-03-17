const R = require('ramda');
const Logger = require('../../../../shared/services/logger');
const pollRepository = require('../../repositories/poll');
const impl = require('./implementation');

/**
 * @module modules/POLL/services/poll
 */

const logger = Logger.getLogger('POLL/service/poll');

const list = async (payload, message) => {
  logger.info('Finding multiple polls', { payload, message });

  return pollRepository.findBy({ id: { $in: payload.pollIds } });
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
  logger.info('Finding poll', { payload, message });
  const poll = await pollRepository.findById(payload.pollId);

  return poll;
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
const create = async (payload, message) => {
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
const vote = async (payload, message) => {
  logger.info('Voting on poll', { payload, message });

  await impl.assertThatPollExistsAndUserHasPermission(payload.networkId, payload.pollId);
  await pollRepository.clearVotes(payload.pollId, message.credentials.id);

  const voteForOption = (optionId) => pollRepository.vote({
    optionId, pollId: payload.pollId, userId: message.credentials.id });

  await Promise.all(R.map(voteForOption, payload.optionIds));

  return pollRepository.findById(payload.pollId);
};

// exports of functions
module.exports = {
  create,
  get,
  list,
  vote,
};
