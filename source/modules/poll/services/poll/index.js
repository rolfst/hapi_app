import * as Logger from '../../../../shared/services/logger';

/**
 * @module modules/POLL/services/poll
 */

const logger = Logger.getLogger('POLL/service/poll');

/**
 * Creates a poll
 * @param {object} payload - Object containing payload data
 * @param {string} payload.userId - The id of the user that creates the poll
 * @param {array} payload.options - An array of options for the poll
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createPoll
 * @return {external:Promise.<Poll>}
 */
export const createPoll = async (payload, message) => {
  logger.info('Creating poll', { payload, message });
  // TODO
  // 1. Create poll
  // 2. Create options
  // 3. Return the poll domain model
};

/**
 * Vote on a poll as authenticated user
 * @param {object} payload - Object containing payload data
 * @param {string} payload.pollId - The id of the user that creates the poll
 * @param {array} payload.optionId - The id op the option that the user voted for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createPoll
 * @return {external:Promise.<Poll>}
 */
export const vote = async (payload, message) => {
  logger.info('Voting on poll', { payload, message });
  // TODO Vote on poll where the creator is the authenticated user
};
