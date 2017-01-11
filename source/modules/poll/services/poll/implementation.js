import R from 'ramda';
import createError from '../../../../shared/utils/create-error';
import * as pollRepository from '../../repositories/poll';
import * as pollOptionRepository from '../../repositories/poll-option';

export const createOption = R.curry((pollId, text, order) => (
  pollOptionRepository.create({ pollId, text, order })
));

/**
 * Check if poll exists
 * @param {string} networkId - Id of the current network
 * @param {string} pollId - Id of the poll
 * @method assertThatPollExists
 * @return {boolean|Error}
 */
export const assertThatPollExistsAndUserHasPermission = async (networkId, pollId) => {
  const poll = await pollRepository.findById(pollId, null);

  if (!networkId || networkId !== poll.networkId || !poll) {
    throw createError('403');
  }

  return true;
};
