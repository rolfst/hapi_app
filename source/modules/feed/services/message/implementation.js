import R from 'ramda';
import createError from '../../../../shared/utils/create-error';
import * as pollService from '../../../poll/services/poll';
import * as networkRepository from '../../../core/repositories/network';
import * as teamRepository from '../../../core/repositories/team';
import * as objectService from '../object';

/**
 * Creates a poll resource that consists of a poll object and a object object.
 * @param {Message} createdMessage - The message where the poll is created for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createPollResource
 * @return {external:Promise.<Object>}
 */
export const createPollResource = (createdMessage, message) => R.pipeP(
  (pollResource) => pollService.create({
    networkId: message.network.id,
    options: pollResource.data.options,
  }, message),
  (createdPoll) => objectService.create({
    userId: message.credentials.id,
    parentType: 'feed_message',
    parentId: createdMessage.id,
    objectType: 'poll',
    sourceId: createdPoll.id,
  }, message)
);

/**
 * Remove objects that are attached to a message. Either as child or as parent.
 * @param {string} messageId - The id of the message
 * @method removeAttachedObjects
 * @return {Promise}
 */
export const removeAttachedObjects = (messageId) => Promise.all([
  objectService.remove({ objectType: 'feed_message', sourceId: messageId }),
  objectService.remove({ parentType: 'feed_message', parentId: messageId }),
]);

/**
 * Get parent by type and id
 * @param {string} parentType - The type of the parent
 * @param {string} parentId - The id of the parent
 * @method getParent
 * @return {Mixed}
 */
export const getParent = async (parentType, parentId) => {
  const parentFn = R.cond([
    [R.equals('network'), R.always(networkRepository.findNetworkById)],
    [R.equals('team'), R.always(teamRepository.findTeamById)],
    [R.T, R.F],
  ])(parentType);

  if (!parentFn) throw createError('403', 'Parent not supported');

  const result = await parentFn(parentId);
  if (!result) throw createError('404', 'Parent not found');

  return result;
};
