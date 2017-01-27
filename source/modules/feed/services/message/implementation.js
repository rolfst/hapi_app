import R from 'ramda';
import * as pollService from '../../../poll/services/poll';
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
    parentType: 'message',
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
