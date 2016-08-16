import { db as Sequelize } from 'connections';
import Boom from 'boom';
import { User } from 'common/models';
import { Conversation } from 'modules/chat/models';

const defaultIncludes = [
  { model: User },
];

/**
 * Find a specific conversation by id
 * @param {number} id - Id of the conversation
 * @param {array} includes - Relationships to include
 * @method findConversationById
 * @return {promise} - Find conversation promise
 */
export function findConversationById(id, includes) {
  return Conversation
    .findById(id, { include: includes })
    .then(conversation => {
      if (!conversation) throw Boom.notFound('No conversation found.');

      return conversation;
    });
}

/**
 * Find all conversations for a specific user
 * @param {User} user - User to find the conversations for
 * @param {array} includes - Relationships to include
 * @method findAllForUser
 * @return {promise} - Get conversations promise
 */
export async function findAllForUser(user, includes = []) {
  const conversations = await user.getConversations({ include: [
    ...includes,
    ...defaultIncludes,
  ] });

  return conversations.map(c => {
    const conversation = c;
    const { Messages } = conversation;

    conversation.last_message = Messages[Messages.length - 1] || null;

    return conversation;
  });
}

export async function findExistingConversationWithUser(loggedUser, user) {
  const conversations = await Conversation.findAll({
    include: [{
      model: User,
      attributes: ['id', [Sequelize.fn('COUNT', '`Users`.`id`'), 'count']],
      where: {
        id: { $in: [loggedUser, user] },
      },
    }],
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
    throw Boom.forbidden('A conversation must have 2 or more participants');
  }

  if (participants[0] === participants[1]) {
    throw Boom.forbidden('You cannot create a conversation with yourself');
  }

  try {
    let conversation = await findExistingConversationWithUser(creatorId, participants[0]);

    if (!conversation) {
      const data = { type: type.toUpperCase(), createdBy: creatorId };
      conversation = await Conversation.create(data);
      await conversation.addUsers(participants);
    }

    return conversation;
  } catch (err) {
    console.error('Error while creating a conversation', err);
  }
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
      if (!conversation) throw Boom.notFound('No conversation found.');

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
