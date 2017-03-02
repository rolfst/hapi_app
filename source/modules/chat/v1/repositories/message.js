import R from 'ramda';
import Promise from 'bluebird';
import { User } from '../../../core/repositories/dao';
import * as objectRepo from '../../../core/repositories/object';
import createFeedMessageModel from '../models/message';
import { Message } from './dao';

/**
 * @module modules/chat/repositories/message
 */

/**
 * Create a new message
 * @param {string} conversationId - Id of conversation to create the message in
 * @param {string} creatorId - Id of the user placing the message
 * @param {string} text - Message text
 * @method createMessage
 * @return {external:Promise} - Create message promise
 */
export async function createMessage(conversationId, creatorId, text) {
  const createdMessage = await Message.create({ userId: creatorId, text });

  const object = await objectRepo.create({
    parentType: 'conversation',
    parentId: conversationId,
    objectType: 'private_message',
    sourceId: createdMessage.id,
    userId: creatorId,
  });

  await Message.update({ objectId: object.id }, { where: { id: createdMessage.id } });

  return createdMessage;
}

/**
 * Find a specific message by id
 * @param {string} id - Id of the message being looked for
 * @method findMessageById
 * @return {external:Promise} - Find message promise
 */
export const findMessageById = async (id) => {
  const result = await Message.findById(id, {
    include: [{ model: User }],
  });

  return createFeedMessageModel(result);
};

/**
 * Find messages by id
 * @param {array<string>} messageIds - Ids of the messages being looked for
 * @method findMessageByIds
 * @return {external:Promise} - Find message promise
 */
export const findMessageByIds = async (messageIds) => {
  const result = await Message.findAll({
    where: { id: { $in: messageIds } },
    include: [{ model: User }],
  });

  return R.map(createFeedMessageModel, result);
};

/**
 * Find all messages for a conversation
 * @param {string} conversationId - Id of the conversation we want the messages from
 * @method findAllForConversation
 * @return {external:Promise} - Get messages promise
 */
export const findAllForConversation = async (conversationId) => {
  const messageObjects = await objectRepo.findBy({
    parentType: 'conversation',
    parentId: conversationId,
    objectType: 'private_message',
  });

  const result = await Message.findAll({
    where: { id: { $in: R.pluck('sourceId', messageObjects) } },
    include: [{ model: User }],
  });

  const output = R.map(createFeedMessageModel, result);

  return R.map(R.assoc('conversationId', conversationId), output);
};

// FIXME: temporary function so we don't break the apps
export const findMessagesForConversations = async (conversationIds) => {
  const result = await Promise.map(conversationIds, findAllForConversation);

  return R.flatten(result);
};
