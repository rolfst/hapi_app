import R from 'ramda';
import { Message } from '../../dao';
import createMessageModel from '../models/message';

/**
 * Find all messages for a conversation
 * @param {string} conversationId - Id of the conversation we want the messages from
 * @param {object} options - Pagination properties
 * @param {string} options.limit - Amount of messages to retrieve
 * @param {string} options.offset - Location which message to start retrieving from
 * @method findForConversation
 * @return {external:Promise} - Get messages promise
 */
export async function findForConversation(conversationId, options) {
  const result = await Message.findAll({
    ...options,
    where: { parentId: conversationId },
  });

  return R.map(createMessageModel, result);
}

/**
 * Counts all messages for a conversation
 * @param {string} conversationId - Id of the conversation we want the messages from
 * @method countForConversation
 * @return {external:Promise.<number>} - count promise
 */
export async function countForConversation(conversationId) {
  return Message.count({ where: { parentId: conversationId } });
}

/**
 * Find all messages for a conversation
 * @param {string[]} conversationIds - Ids of the conversations we want the messages from
 * @method findForConversations
 * @return {external:Promise} - Get messages promise
 */
export async function findForConversations(conversationIds) {
  const result = await Message.findAll({
    where: { parentId: { $in: conversationIds } },
  });

  return R.map(createMessageModel, result);
}
