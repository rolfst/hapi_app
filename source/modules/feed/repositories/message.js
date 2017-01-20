import R from 'ramda';
import { Message } from './dao';
import createDomainObject from '../models/message';

/**
 * Find a message by id
 * @param {string} messageId - The id of the message
 * @method findById
 * @return {Message} {@link module:feed~Message message}
 */
export const findById = async (messageId) => {
  const result = await Message.findById(messageId);
  if (!result) return null;

  return createDomainObject(result);
};

/**
 * Creating a message
 * @param {object} attributes - Attributes for creating a message
 * @param {string} attributes.userId - The user id that creates the message
 * @param {string} attributes.text - The text that contains the message
 * @method create
 * @return {Message} {@link module:feed~Message message}
 */
export const create = async (attributes) => {
  const attributesWhitelist = ['userId', 'text'];
  const result = await Message.create(R.pick(attributesWhitelist, attributes));

  return createDomainObject(result);
};

export const destroy = (messageId) => Message.destroy({ where: { id: messageId } });
