import { db as Sequelize } from 'connections';
import createError from '../../../shared/utils/create-error';
import { User } from '../../../shared/models';
import { Conversation, Message, ConversationUser } from '../models';

const defaultIncludes = [
  { model: User },
  { model: Message, as: 'LastMessage' },
];

/**
 * Find a specific conversation by id
 * @param {number} id - Id of the conversation
 * @param {array} includes - Relationships to include
 * @method findConversationById
 * @return {promise} - Find conversation promise
 */
export async function findConversationById(id, includes = []) {
  const conversation = await Conversation.findById(id, {
    include: [...includes, ...defaultIncludes],
  });

  if (!conversation) throw createError('404');

  return conversation;
}

/**
 * Find all conversations for a specific user
 * @param {User} user - User to find the conversations for
 * @param {array} includes - Relationships to include
 * @method findAllForUser
 * @return {promise} - Get conversations promise
 */
export function findAllForUser(user, includes = []) {
  return user.getConversations({
    include: [...includes, ...defaultIncludes],
  });
}

export async function findExistingConversation(participantIds) {
  const result = await Conversation.findAll({
    attributes: ['id', [Sequelize.fn('COUNT', '`ConversationUser`.`id`'), 'users_in_conversation']],
    include: [{
      model: User,
      where: { id: { $in: participantIds } },
    }],
    group: ['Conversation.id'],
    having: ['users_in_conversation = 2'],
  });

  if (result.length === 0) return null;

  return findConversationById(result[0].id);
}

/**
 * Create a conversation
 * @param {string} type - Type of the conversation to be created
 * @param {number} creatorId - Id of the conversation starter
 * @param {array} participants - All users participating in the conversation
 * @method createConversation
 * @return {promise} - Create conversation promise
 */
export const createConversation = async (type, creatorId, participants) => {
  const conversation = await Conversation.create({ type, createdBy: creatorId });
  await conversation.setUsers(participants);

  return findConversationById(conversation.id);
};

/**
 * Delete a specific conversation by id
 * @param {number} id - Id of the conversation to be deleted
 * @method deleteConversationById
 * @return {promise} - Delete conversation promise
 */
export function deleteConversationById(id) {
  return Conversation
    .findById(id)
    .then(conversation => {
      if (!conversation) throw createError('404');

      return conversation.destroy();
    });
}

/**
 * Delete all conversations for a user
 * @param {User} user - User to delete the conversations of
 * @method deleteAllConversationsForUser
 * @return {promise} - Get conversations promise
 */
export function deleteAllConversationsForUser(user) {
  return user.setConversations([]);
}
