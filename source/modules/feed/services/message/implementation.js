import { pipeP } from 'ramda';
import * as pollService from '../../../poll/services/poll';
import * as objectService from '../object';

/**
 * Creates a poll resource that consists of a poll object and a object object.
 * @param {object} createdMessage - The message where the poll is created for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method remove
 * @return {external:Promise.<Boolean>}
 */
export const createPollResource = (createdMessage, message) => pipeP(
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
