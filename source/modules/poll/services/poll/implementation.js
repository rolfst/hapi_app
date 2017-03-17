const R = require('ramda');
const createError = require('../../../../shared/utils/create-error');
const pollRepository = require('../../repositories/poll');
const pollOptionRepository = require('../../repositories/poll-option');

const createOption = R.curry((pollId, text, order) => (
  pollOptionRepository.create({ pollId, text, order })
));

/**
 * Check if poll exists
 * @param {string} networkId - Id of the current network
 * @param {string} pollId - Id of the poll
 * @method assertThatPollExists
 * @return {boolean|Error}
 */
const assertThatPollExistsAndUserHasPermission = async (networkId, pollId) => {
  const poll = await pollRepository.findById(pollId, null);

  if (!networkId || networkId !== poll.networkId || !poll) {
    throw createError('403');
  }

  return true;
};

// exports of functions
module.exports = {
  assertThatPollExistsAndUserHasPermission,
  createOption,
};
