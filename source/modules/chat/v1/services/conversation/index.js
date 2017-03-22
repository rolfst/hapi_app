const { uniq, filter, map, omit } = require('lodash');
const R = require('ramda');
const createError = require('../../../../../shared/utils/create-error');
const objectService = require('../../../../core/services/object');
const conversationRepo = require('../../repositories/conversation');
const messageRepo = require('../../repositories/message');
const ChatDispatcher = require('../../dispatcher');
const impl = require('./implementation');

/**
 * @module modules/chat/services/conversation
 */

/**
 * Creates a new conversation
 * @param {object} payload - Object containing payload data
 * @param {ConversationType} payload.type {@link module:modules/chat~ConversationType}
 * - The type of conversation
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Integration[]>} {@link module:modules/core~Integration Integration} -
 */
const create = async (payload, message) => {
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

/**
 * Lists all conversations
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.ids - all convesation ids to load
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Conversation[]>} {@link module:modules/chat~Conversation Conversation}
 * - Promise containing a list of conversations§
 */
const listConversations = async (payload) => {
  const conversations = await conversationRepo.findConversationsById(payload.ids);
  const messages = await messageRepo.findMessagesForConversations(map(conversations, 'id'));

  return map(conversations, (conversation) => {
    const messagesForConversation = filter(messages, { conversationId: conversation.id });
    const conversationMessages = map(messagesForConversation,
      (message) => omit(message, 'conversation', 'update_at')
    );

    return R.merge(conversation,
      {
        lastMessage: conversationMessages[conversationMessages.length - 1],
        messages: conversationMessages,
      });
  });
};

/**
 * Retrieve a single conversation.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.id - The id of the conversation
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getConversation
 * @return {external:Promise.<Conversation>} {@link module:modules/chat~Conversation} -
 * Promise containing a single conversation
 */
const getConversation = async (payload, message) => {
  const conversation = await conversationRepo.findConversationById(payload.id);
  if (!conversation) throw createError('404');

  impl.assertThatUserIsPartOfTheConversation(conversation, message.credentials.id);

  const messageObjects = await objectService.list({
    parentType: 'conversation',
    parentId: payload.id,
  });

  const messages = await messageRepo.findMessageByIds(R.pluck('sourceId', messageObjects));

  return R.mergeAll([conversation, { lastMessage: R.last(messages) }, messages]);
};

/**
 * Retrieve conversations for specific user.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.id - The id of the user
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listConversationsForUser
 * @return {external:Promise.<Conversation[]>} {@link module:modules/chat~Conversation} -
 * Promise containing a list of conversations
 */
const listConversationsForUser = async (payload, message) => {
  const conversationIds = await conversationRepo.findIdsForUser(payload.id);

  return listConversations({ ids: conversationIds }, message);
};

/**
 * List the messages that are created for a conversation.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.id - The id of the conversation
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listMessages
 * @return {external:Promise.<Message[]>} {@link module:modules/chat~Message} -
 * Promise containing a list of messages
 */
const listMessages = async (payload, message) => {
  const conversation = await conversationRepo.findConversationById(payload.id);
  if (!conversation) throw createError('404');

  impl.assertThatUserIsPartOfTheConversation(conversation, message.credentials.id);

  return messageRepo.findAllForConversation(payload.id);
};

/**
 * Retrieve a single message.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.messageId - The id of the message
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getMessage
 * @return {external:Promise.<Message>} {@link module:modules/chat~Message} -
 * Promise containing a message
 */
const getMessage = async (payload) => {
  const message = await messageRepo.findMessageById(payload.messageId);
  if (!message) throw createError('404');

  return message;
};

/**
 * Create a message for a conversation.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.id - The id of the conversation
 * @param {string} payload.text - The text of the message
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createMessage
 * @return {external:Promise.<Message>} {@link module:modules/chat~Message} - Promise containing
 * the created message
 */
const createMessage = async (payload, message) => {
  const { id, text } = payload;
  const { credentials } = message;
  const conversation = await getConversation({ id }, message);

  const createdMessage = await messageRepo.createMessage(
    conversation.id, credentials.id, text);

  const refreshedMessage = await getMessage({ messageId: createdMessage.id });
  await conversationRepo.update(id, { updatedAt: new Date() });
  const updatedConversation = await getConversation({ id }, message);
  refreshedMessage.conversationId = payload.id;
  refreshedMessage.conversation = updatedConversation;


  ChatDispatcher.emit('message.created', {
    conversation,
    message: refreshedMessage,
    token: message.artifacts.authenticationToken,
  });

  return refreshedMessage;
};

exports.create = create;
exports.createMessage = createMessage;
exports.getConversation = getConversation;
exports.getMessage = getMessage;
exports.listConversationsForUser = listConversationsForUser;
exports.listConversations = listConversations;
exports.listMessages = listMessages;
