import * as Logger from '../../../../../shared/services/logger';
import * as objectService from '../../../../feed/services/object';
import * as privateMessageRepository from '../../repositories/private-message';

const logger = Logger.createLogger('CHAT/service/conversation');

/**
 * Listing private messages
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.messageIds - The ids of the messages to list
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<PrivateMessage[]>} {@link module:modules/chat~PrivateMessage}
 */
export const list = async (payload, message) => {
  logger.info('Listing private messages', { payload, message });

  return privateMessageRepository.findByIds(payload.messageIds);
};

/**
 * Create private message
 * @param {object} payload - Object containing payload data
 * @param {string} payload.conversationId - The id of the conversation the message is created in.
 * @param {string[]} payload.text - The text of the message
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<PrivateMessage>} {@link module:modules/chat~PrivateMessage}
 */
export async function create(payload, message) {
  logger.info('Creating private message', { payload, message });

  const createObjectPayload = (createdMessage) => ({
    userId: message.credentials.id,
    parentType: 'conversation',
    parentId: payload.conversationId,
    objectType: 'private_message',
    sourceId: createdMessage.id,
  });

  const createdMessage = await privateMessageRepository.create({
    objectId: null, text: payload.text });
  const createdObject = await objectService.create(createObjectPayload(createdMessage));

  privateMessageRepository.update(createdMessage.id, { objectId: createdObject.id });

  return { ...createdMessage, objectId: createdObject.id };
}
