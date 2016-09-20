import { db as Sequelize } from 'connections';
import createError from '../../../common/utils/create-error';
import { User } from '../../../common/models';
import { Conversation, Message } from '../models';

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

export async function findExistingConversationWithUser(loggedUserId, userId) {
  const extraIncludes = {
    model: User,
    attributes: ['id', [Sequelize.fn('COUNT', '`Users`.`id`'), 'count']],
    where: {
      id: { $in: [loggedUserId, userId] },
    },
  };

  const conversations = await Conversation.findAll({
    include: [{ model: Message, as: 'LastMessage' }, extraIncludes],
    group: ['Conversation.id'],
    having: [
      '`Users.count` = 2',
    ],
  });

  return conversations[0];
}

/**
 * Create a conversation
 * @param {string} type - Type of the conversation to be created
 * @param {number} creatorId - Id of the conversation starter
 * @param {array} participants - All users participating in the conversation
 * @method createConversation
 * @return {promise} - Create conversation promise
 */
export async function createConversation(type, creatorId, participants) {
  // TODO: Move logic to acl
  if (participants.length < 2) {
    throw createError('403', 'A conversation must have 2 or more participants');
  }

  if (participants[0] === participants[1]) {
    throw createError('403', 'You cannot create a conversation with yourself');
  }

  let conversation = await findExistingConversationWithUser(creatorId, participants[0]);

  if (!conversation) {
    const data = { type: type.toUpperCase(), createdBy: creatorId };
    conversation = await Conversation.create(data);
    await conversation.addUsers(participants);
  }

  return conversation.reload();
}

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
