import R from 'ramda';
import Promise from 'bluebird';
import createError from '../../../../shared/utils/create-error';
import * as pollService from '../../../poll/services/poll';
import * as objectService from '../object';
import * as networkImpl from '../../../core/services/network/implementation';
import * as teamImpl from '../../../core/services/team/implementation';

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
    options: pollResource.options,
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
 * Check if the user has permission to view the message
 * @param {string} messageId - The id of the message
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method assertThatUserBelongsToMessage
 * @throws Error - 404
 */
export const assertThatUserBelongsToMessage = async (messageId, message) => {
  const payload = { objectType: 'feed_message', sourceId: messageId };

  const { parentType, parentId } = await objectService.getObject(payload, message);
  const userId = message.credentials.id;

  try {
    await R.cond([
      [R.equals('network'), () => networkImpl.assertThatUserBelongsToTheNetwork],
      [R.equals('team'), () => teamImpl.assertThatUserBelongsToTheTeam],
    ])(parentType)(parentId, userId);
  } catch (err) {
    throw createError('404');
  }
};
