import Message from 'modules/chat/models/message';
import Boom from 'boom';

/**
 * Find all messages by conversation
 * @param {Conversation} conversation - Conversation we want the messages from
 * @method findAllForConversation
 * @return {promise} - Get messages promise
 */
export function findAllForConversation(conversation) {
  return conversation.getMessages();
}

/**
 * Create a new message
 * @param {number} conversationId - Id of conversation to create the message in
 * @param {number} creatorId - Id of the user placing the message
 * @param {string} text - Message text
 * @method createMessage
 * @return {promise} - Create message promise
 */
export function createMessage(conversationId, creatorId, text) {
  return Message.create({
    parentId: conversationId,
    parentType: 'FlexAppeal\\Entities\\Conversation',
    text,
    createdBy: creatorId,
    messageType: 'default',
  });
}

/**
 * Find a specific message by id
 * @param {number} id - Id of the message being looked for
 * @param {array} includes - Relationships to include
 * @method findMessageById
 * @return {promise} - Find message promise
 */
export function findMessageById(id, includes) {
  return Message
    .findById(id, { include: includes })
    .then(message => {
      if (!message) throw Boom.notFound('No message found.');

      return message;
    });
}
