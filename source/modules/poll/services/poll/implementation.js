const R = require('ramda');
const createError = require('../../../../shared/utils/create-error');
const pollRepository = require('../../repositories/poll');
const pollOptionRepository = require('../../repositories/poll-option');

const createOption = R.curry((pollId, text, order) => (
  pollOptionRepository.create({ pollId, text, order })
));

/**
 * Check if poll exists
 * @param {string} pollId - Id of the poll
 * @method assertThatPollExists
 * @return {boolean|Error}
 */
const assertThatPollExists = async (pollId) => {
  const poll = await pollRepository.findById(pollId, null);

  if (!poll) {
    throw createError('403');
  }

  return true;
};

exports.assertThatPollExists = assertThatPollExists;
exports.createOption = createOption;
