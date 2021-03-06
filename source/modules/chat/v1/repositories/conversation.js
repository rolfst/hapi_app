const { map } = require('lodash');
const R = require('ramda');
const Sequelize = require('../../../../shared/configs/sequelize');
const { User } = require('../../../core/repositories/dao');
const objectRepository = require('../../../core/repositories/object');
const { Conversation, Message, ConversationUser } = require('./dao');
const createConversationModel = require('../models/conversation');

/**
 * @module modules/chat/repositories/conversation
 */

const defaultIncludes = [{
  model: User,
}];

const toModel = (dao) => createConversationModel(dao);

/**
 * Find a specific conversation by id
 * @param {string} id - Id of the conversation
 * @method findConversationById
 * @return {external:Promise} - Find conversation promise
 */
async function findConversationById(id) {
  const conversation = await Conversation.findById(id, {
    include: defaultIncludes,
  });

  if (!conversation) return null;

  const objects = await objectRepository.findBy({
    parentType: 'conversation',
    parentId: id,
    objectType: 'private_message',
  });

  const messages = await Message.findAll({
    where: { id: { $in: R.pluck('sourceId', objects) } },
    include: [{ model: User }],
  });

  conversation.Messages = messages;

  return toModel(conversation);
}

/**
 * Find specific conversations by ids
 * @param {string[]} id - Id of the conversation
 * @method findConversationsById
 * @return {external:Promise} - Find conversation promise
 */
const findConversationsById = async (conversationIds) => {
  const results = await Conversation.findAll({
    where: { id: { $in: conversationIds } },
    include: defaultIncludes,
  });

  return map(results, toModel);
};

/**
 * Find conversation ids for a specific user
 * @param {string} userId - User to find the conversations for
 * @method findIdsForUser
 * @return {external:Promise.<string[]>} - Returns conversation ids
 */
const findIdsForUser = async (userId) => {
  const pivotResult = await ConversationUser.findAll({
    attributes: ['conversation_id'],
    where: { userId },
    group: ['conversation_id'],
  });

  return map(pivotResult, 'conversation_id');
};

/**
 * Find specific conversations by ids
 * @param {string[]} participantIds - Ids of the users who participated in the conversation
 * @method findExistingConversation
 * @return {external:Promise} - Find conversation promise
 */
async function findExistingConversation(participantIds) {
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
 * @param {string} creatorId - Id of the conversation starter
 * @param {array} participants - All users participating in the conversation
 * @method createConversation
 * @return {external:Promise} - Create conversation promise
 */
const createConversation = async (type, creatorId, participants) => {
  const conversation = await Conversation.create({ type, createdBy: creatorId });
  await conversation.setUsers(participants);

  return findConversationById(conversation.id);
};

/**
 * Delete a specific conversation by id
 * @param {string} id - Id of the conversation to be deleted
 * @method deleteConversationById
 * @return {external:Promise} - Delete conversation promise
 */
function deleteConversationById(id) {
  return Conversation.destroy({ where: { id } });
}

/**
 * Delete all conversations for a user
 * @param {User} userId - User id to delete the conversations of
 * @method deleteAllConversationsForUser
 * @return {external:Promise} - Get conversations promise
 */
const deleteAllConversationsForUser = (userId) => {
  return ConversationUser.destroy({ where: { userId } });
};

/**
 * Updates a conversation with the current timestamp
 * @param {string} conversationId
 * @param {object} attributes
 * @param {date} attributes.updatedAt
 * @method update
 */
async function update(conversationId, { updatedAt }) {
  const result = await Conversation.findById(conversationId);
  if (!result) return null;

  return result.update({ updatedAt })
    .then(toModel);
}

exports.createConversation = createConversation;
exports.deleteAllConversationsForUser = deleteAllConversationsForUser;
exports.deleteConversationById = deleteConversationById;
exports.findConversationById = findConversationById;
exports.findConversationsById = findConversationsById;
exports.findExistingConversation = findExistingConversation;
exports.findIdsForUser = findIdsForUser;
exports.update = update;
