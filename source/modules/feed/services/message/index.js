import * as Logger from '../../../../shared/services/logger';

/**
 * @module modules/feed/services/object
 */

const logger = Logger.getLogger('FEED/service/object');

/**
 * Listing messages
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.messageIds - The type of parent to get objects for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listMessages
 * @return {external:Promise.<Message[]>}
 */
export const listMessages = async (payload, message) => {
  logger.info('Listing messages', { payload, message });
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
export const createMessage = async (payload, message) => {
  logger.info('Creating message', { payload, message });
  // TODO
  // 1. Create message
  // 2. Create the resource for the message
  // 3. Create an object as child for the resource
};
