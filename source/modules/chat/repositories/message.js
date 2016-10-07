import { User } from '../../../shared/models';
import { Message, Conversation } from '../models';

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
export const findMessageById = async (id) => {
  return Message.findById(id, {
    include: [{ model: Conversation, include: [User] }, User],
  });
};
