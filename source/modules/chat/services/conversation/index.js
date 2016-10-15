import { uniq, filter, map, omit } from 'lodash';
import createError from '../../../../shared/utils/create-error';
import * as impl from './implementation';
import * as conversationRepo from '../../repositories/conversation';
import * as messageRepo from '../../repositories/message';

export const create = async (payload, message) => {
  const participants = uniq([...payload.participants, message.credentials.id]);

  if (participants.length < 2) {
    throw createError('403', 'A conversation must have 2 or more participants');
  }

  if (participants[0].toString() === participants[1].toString()) {
    throw createError('403', 'You cannot create a conversation with yourself');
  }

  const conversation = await impl.findExistingConversation(participants);

  if (!conversation) {
    return impl.createConversationWithParticipants(
      payload.type, message.credentials.id, participants);
  }

  return conversation;
};

export const listConversations = async (payload) => {
  const conversations = await conversationRepo.findConversationsById(payload.ids);
  const messages = await messageRepo.findMessagesForConversations(map(conversations, 'id'));

  return map(conversations, (conversation) => {
    const messagesForConversation = filter(messages, { conversationId: conversation.id });
    const conversationMessages = map(messagesForConversation,
      (message) => omit(message, 'conversation', 'update_at')
    );

    return {
      ...conversation,
      lastMessage: conversationMessages[conversationMessages.length - 1],
      messages: conversationMessages,
    };
  });
};

/**
 * Retrieve a single conversation.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.id - The id of the conversation
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method getConversation
 * @return {Promise} Promise containing a single conversation
 */
export const getConversation = async (payload, message) => {
  const conversation = await conversationRepo.findConversationById(payload.id);
  if (!conversation) throw createError('404');

  const lastMessages = await messageRepo.findLastForConversations([conversation.id]);

  impl.assertThatUserIsPartOfTheConversation(conversation, message.credentials.id);

  return { ...conversation, lastMessage: lastMessages[0] };
};

/**
 * Retrieve conversations for specific user.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.id - The id of the user
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method getConversationsForUser
 * @return {Promise} Promise containing a single conversation
 */

export const listConversationsForUser = async (payload, message) => {
  const conversationIds = await conversationRepo.findIdsForUser(payload.id);

  return listConversations({ ids: conversationIds }, message);
};

/**
 * List the messages that are created for a conversation.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.id - The id of the conversation
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method listMessages
 * @return {Promise} Promise containing collection of messages
 */
export const listMessages = async (payload, message) => {
  const conversation = await getConversation(payload, message);

  return messageRepo.findAllForConversation(conversation.id);
};

/**
 * Retrieve a single message.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.messageId - The id of the message
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method getMessage
 * @return {Promise} Promise containing a message
 */
export const getMessage = async (payload) => {
  const message = await messageRepo.findMessageById(payload.messageId);
  if (!message) throw createError('404');

  return message;
};

/**
 * Create a message for a conversation.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.id - The id of the conversation
 * @param {string} payload.text - The text of the message
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method createMessage
 * @return {Promise} Promise containing the created message
 */
export const createMessage = async (payload, message) => {
  const { id, text } = payload;
  const { credentials } = message;
  const conversation = await getConversation({ id }, message);

  const createdMessage = await messageRepo.createMessage(
    conversation.id, credentials.id, text);

  const refreshedMessage = await getMessage({ messageId: createdMessage.id });

  impl.notifyUsersForNewMessage(
    conversation, refreshedMessage, message.artifacts.authenticationToken);

  return refreshedMessage;
};
