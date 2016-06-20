import Boom from 'boom';
import { User } from 'common/models';
import { Conversation } from 'modules/chat/models';

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
      if (!conversation) return Boom.notFound('No conversation found.');

      return conversation.destroy();
    })
    .catch(err => Boom.badRequest(err));
}

/**
 * Delete all conversations for a user
 * @param {User} user - User to delete the conversations of
 * @method deleteAllConversationsForUser
 * @return {promise} - Get conversations promise
 */
export function deleteAllConversationsForUser(user) {
  return user.getConversations()
    .then(conversations => {
      return Promise.all(conversations.map(conversation => conversation.destroy()));
    });
}

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
      if (!conversation) return Boom.notFound('No conversation found.');

      return conversation;
    })
    .catch(err => Boom.badRequest(err));
}

/**
 * Find all conversations for a specific user
 * @param {User} user - User to find the conversations for
 * @param {array} includes - Relationships to include
 * @method findAllForUser
 * @return {promise} - Get conversations promise
 */
export function findAllForUser(user, includes = []) {
  return user.getConversations({ include: [...includes, { model: User }] });
}

/**
 * Create a conversation
 * @param {string} type - Type of the conversation to be created
 * @param {number} creatorId - Id of the conversation starter
 * @param {array} participants - All users participating in the conversation
 * @method createConversation
 * @return {promise} - Create conversation promise
 */
export function createConversation(type, creatorId, participants) {
  // TODO: Move logic to acl
  if (participants.length < 2) {
    return Boom.forbidden('A conversation must have 2 or more participants');
  }

  if (participants[0] === participants[1]) {
    return Boom.forbidden('You cannot create a conversation with yourself');
  }

  // TODO: Add acl to check if user already has a conversation with a participant
  // user.hasConversationWith(User, users);
  return Conversation.create({ type: type.toUpperCase(), createdBy: creatorId })
    .then(createdConversation => {
      return createdConversation.addUsers(participants)
        .then(() => createdConversation);
    })
    .catch(err => console.error('Error while creating a conversation: ', err));
}
