import R from 'ramda';
import { User } from '../../../../shared/models';
import { Conversation, ConversationUser } from '../../dao';
import createConversationModel from '../models/conversation';

/**
 * Find multiple conversations
 * @param {string[]} conversationIds - The id of the conversation to find
 * @param {object} options - The options for pagination
 * @param {string} options.offset - The offset of the result set
 * @param {string} options.limit - The limit of the result set
 * @method findByIds
 * @return {external:Promise.<Conversation[]>} - Returns conversation models
 */
export async function findByIds(conversationIds, options) {
  const result = await Conversation.findAll({
    ...options,
    include: { attributes: ['id'], model: User },
    where: { id: { $in: conversationIds } },

  });

  return R.map(createConversationModel, result);
}

export async function countConversationsForUser(userId) {
  return ConversationUser.count({ where: { userId } });
}

/**
 * Find conversation ids for a specific user
 * @param {string} userId - User to find the conversations for
 * @method findIdsForUser
 * @return {external:Promise.<String[]>} - Returns conversation ids
 */
export async function findIdsForUser(userId) {
  const pivotResult = await ConversationUser.findAll({
    attributes: ['conversation_id'],
    where: { userId },
    group: ['conversation_id'],
  });

  return R.pipe(R.pluck('conversation_id'), R.map(R.toString))(pivotResult);
}

export const findConversationsForUser = (userId) =>
  R.pipeP(findIdsForUser, findByIds)(userId);
