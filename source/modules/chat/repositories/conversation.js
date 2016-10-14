import { map } from 'lodash';
import { db as Sequelize } from '../../../connections';
import createError from '../../../shared/utils/create-error';
import { User } from '../../../shared/models';
import createConversationModel from '../models/conversation';
import { Conversation, ConversationUser } from './dao';

const toModel = (dao) => createConversationModel(dao);

/**
 * Find a specific conversation by id
 * @param {number} id - Id of the conversation
 * @method findConversationById
 * @return {promise} - Find conversation promise
 */
export async function findConversationById(id) {
  const conversation = await Conversation.findById(id, {
    include: [{ model: User }],
  });

  if (!conversation) return null;

  return toModel(conversation);
}

export const findConversationsById = async (conversationIds) => {
  const results = await Conversation.findAll({
    where: { id: { $in: conversationIds } },
    include: [{ model: User }],
  });

  return map(results, toModel);
};

/**
 * Find conversation ids for a specific user
 * @param {number} userId - User to find the conversations for
 * @method findIdsForUser
 * @return {Array<number>} - Returns conversation ids
 */
export const findIdsForUser = async (userId) => {
  const pivotResult = await ConversationUser.findAll({
    attributes: ['conversation_id'],
    where: { userId },
    group: ['conversation_id'],
  });

  return map(pivotResult, 'conversation_id');
};

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
 * @param {User} userId - User id to delete the conversations of
 * @method deleteAllConversationsForUser
 * @return {promise} - Get conversations promise
 */
export const deleteAllConversationsForUser = (userId) => {
  return ConversationUser.destroy({ where: { userId } });
};
