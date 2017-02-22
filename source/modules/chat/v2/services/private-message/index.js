import R from 'ramda';
import Promise from 'bluebird';
import * as Logger from '../../../../../shared/services/logger';
import createError from '../../../../../shared/utils/create-error';
import * as objectService from '../../../../feed/services/object';
import * as attachmentService from '../../../../attachment/services/attachment';
import * as privateMessageRepository from '../../repositories/private-message';
import * as conversationRepository from '../../repositories/conversation';
import ChatDispatcher from '../../dispatcher';

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
 * @param {object} payload.attachments - Attachments to upload with message
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<PrivateMessage>} {@link module:modules/chat~PrivateMessage}
 */
export async function create(payload, message) {
  logger.info('Creating private message', { payload, message });

  const conversation = await conversationRepository.findById(payload.conversationId);
  if (!conversation) throw createError('404');

  const createObjectPayload = (createdMessage) => ({
    userId: message.credentials.id,
    parentType: 'conversation',
    parentId: payload.conversationId,
    objectType: 'private_message',
    sourceId: createdMessage.id,
  });

  const createdMessage = await privateMessageRepository.create({
    userId: message.credentials.id, objectId: null, text: payload.text });

  if (payload.attachments) {
    await Promise.map(R.flatten([payload.attachments]), (file) => attachmentService.create({
      file,
      parentType: 'private_message',
      parentId: createdMessage.id,
    }, message));
  }

  const createdObject = await objectService.create(createObjectPayload(createdMessage));

  privateMessageRepository.update(createdMessage.id, { objectId: createdObject.id });

  const output = R.merge(createdObject, {
    source: { ...createdMessage, objectId: createdObject.id },
  });

  ChatDispatcher.emit('message.created', {
    conversation,
    object: output,
    token: message.artifacts.authenticationToken,
  });

  return output;
}
