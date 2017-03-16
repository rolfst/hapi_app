const R = require('ramda');
const { PollOption } = require('./dao');
const createPollOptionModel = require('../models/poll-option');

/**
 * Create a new poll option
 * @param {obect} attributes - PollOption attributes
 * @param {string} attributes.pollId - Id of the poll to create option for
 * @param {string} attributes.text - Text for the option
 * @param {integer} attributes.order - Position of the option
 * @method create
 * @return {external:Promise} - Create poll option promise
 */
export const create = async (attributes) => {
  const whitelist = ['pollId', 'text', 'order'];
  const pollOption = await PollOption.create(R.pick(whitelist, attributes));

  return createPollOptionModel(pollOption);
};
