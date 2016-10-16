import { map } from 'lodash';
import sequelize from 'sequelize';
import { User } from '../../../shared/models';
import { Message, Conversation } from './dao';
import createMessageModel from '../models/message';

const toModel = (dao) => createMessageModel(dao);

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
 * @method findMessageById
 * @return {promise} - Find message promise
 */
export const findMessageById = async (id) => {
  const result = await Message.findById(id, {
    include: [{ model: Conversation, include: [User] }, User],
  });

  return toModel(result);
};

/**
 * Find messages by id
 * @param {array<number>} messageIds - Ids of the messages being looked for
 * @method findMessageByIds
 * @return {promise} - Find message promise
 */
export const findMessageByIds = async (messageIds) => {
  const result = await Message.findAll({
    where: { id: { $in: messageIds } },
    include: [{ model: Conversation, include: [User] }, User],
  });

  return map(result, toModel);
};

/**
 * Find all messages for a conversation
 * @param {number} conversationId - Id of theonversation we want the messages from
 * @method findAllForConversation
 * @return {promise} - Get messages promise
 */
export const findAllForConversation = async (conversationId) => {
  const result = await Message.findAll({
    attributes: ['id'],
    where: { parentId: conversationId },
  });

  return findMessageByIds(map(result, 'id'));
};

// FIXME: temporary function so we don't break the apps
export const findMessagesForConversations = async (conversationIds) => {
  const result = await Message.findAll({
    include: [{
      attributes: [],
      model: Conversation,
      where: { id: { $in: conversationIds } },
    }],
  });

  const plainObjs = map(result, (item) => item.get({ plain: true }));
  return findMessageByIds(map(plainObjs, 'id'));
};

export const findLastForConversations = async (conversationIds) => {
  const result = await Message.findAll({
    attributes: [[sequelize.fn('MAX', sequelize.col('Message.id')), 'message_id']],
    include: [{
      attributes: [],
      model: Conversation,
      where: { id: { $in: conversationIds } },
    }],
    group: 'Message.parent_id',
  });

  const plainObjs = map(result, (item) => item.get({ plain: true }));
  return findMessageByIds(map(plainObjs, 'message_id'));
};
