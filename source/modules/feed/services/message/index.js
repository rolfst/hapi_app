import { pipeP, any, filter, whereEq } from 'ramda';
import * as Logger from '../../../../shared/services/logger';
import * as messageRepository from '../../repositories/message';
import * as objectService from '../object';

/**
 * @module modules/feed/services/object
 */

const logger = Logger.getLogger('FEED/service/object');

/**
 * My method description
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - The id of the message to retrieve
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getMessage
 * @return -
 */
export const get = async (payload, message) => {
  logger.info('Finding message', { payload, message });
  const result = await messageRepository.findById(payload.messageId);
  // TODO find child object

  return result;
};

/**
 * Listing messages
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.messageIds - The ids of the messages to list
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listMessages
 * @return {external:Promise.<Message[]>}
 */
export const list = async (payload, message) => {
  logger.info('Listing multiple messages', { payload, message });
  // TODO Listing messages with their children objects
};

/**
 * Creates a message as authenticated user with an associated object entry.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.parentType - The type of parent to create the object for
 * @param {string} payload.parentId - The id of the parent
 * @param {string} payload.text - The text of the message
 * @param {object[]} payload.resources - The resources that belong to the message
 * @param {string} payload.resources[].type - The type of the resource
 * @param {object} payload.resources[].data - The data for the resource
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createMessage
 * @return {external:Promise.<Message>}
 */
export const create = async (payload, message) => {
  logger.info('Creating message', { payload, message });

  const createdMessage = await messageRepository.create({
    userId: message.credentials.id,
    text: payload.text,
  });

  const containsResource = (type) => any(whereEq({ type }), payload.resources);
  const getResources = (type) => filter(whereEq({ type }), payload.resources);

  await objectService.create({
    userId: message.credentials.id,
    parentType: payload.parentType,
    parentId: payload.parentId,
    objectType: 'message',
    sourceId: createdMessage.id,
  });

  if (containsResource('poll')) {
    const pollResources = getResources('poll');
    const result = await pipeP(
      // (pollResource) => pollService.create({
      //   // TODO
      // }),
      (createdPoll) => objectService.create({
        userId: message.credentials.id,
        parentType: 'message',
        parentId: createdMessage.id,
        objectType: 'poll',
        // sourceId: createdPoll.id,
        sourceId: '123',
      })
    )(pollResources);
  }

  return createdMessage;
  // 1. Create message
  // 2. Create the resource for the message
  // 3. Create an object as child for the resource
};
