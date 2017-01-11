import { map, pick } from 'ramda';
import { Message } from './dao';
import createModel from '../models/message';

/**
 * Find a message by id
 * @param {string} messageId - The id of the message
 * @method findById
 * @return {Message}
 */
export const findById = async (messageId) => {
  const result = await Message.findById(messageId);
  if (!result) return null;

  return createModel(result);
};

/**
 * Find messages by ids
 * @param {string[]} messageIds - The ids of the messages
 * @method findByIds
 * @return {Message[]}
 */
export const findByIds = async (messageIds) => {
  const results = await Message.findAll({
    where: { id: { in: messageIds } },
  });

  return map(createModel, results);
};

/**
 * Creating a message
 * @param {object} attributes - Attributes for creating a message
 * @param {string} attributes.userId - The user id that creates the message
 * @param {string} attributes.text - The text that contains the message
 * @method create
 * @return {Message}
 */
export const create = async (attributes) => {
  const attributesWhitelist = ['userId', 'text'];
  const result = await Message.create(pick(attributesWhitelist, attributes));

  return createModel(result);
};

export const destroy = (messageId) => Message.destroy({ where: { id: messageId } });
