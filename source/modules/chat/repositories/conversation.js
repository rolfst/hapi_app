import Boom from 'boom';
import User from 'common/models/user';
import Conversation from 'modules/chat/models/conversation';
import Message from 'modules/chat/models/message';

export function deleteConversationById(id) {
  return Conversation
    .findById(id)
    .then(conversation => {
      if (!conversation) return Boom.notFound('No conversation found.');

      return conversation.destroy();
    })
    .catch(err => Boom.badRequest(err));
}

export function deleteAllConversationsForUser(user) {
  return user.getConversations()
    .then(conversations => {
      conversations.map(conversation => {
        conversation.destroy();
      });
    });
}

export function findConversationById(id, includes) {
  return Conversation
    .findById(id, { include: includes })
    .then(conversation => {
      if (!conversation) return Boom.notFound('No conversation found.');

      return conversation;
    })
    .catch(err => Boom.badRequest(err));
}

export function findAllForUser(user, includes) {
  return user.getConversations({ include: includes });
}

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
      return [createdConversation, createdConversation.addUsers(participants)];
    })
    .spread(conversationWithParticipants => {
      return findConversationById(conversationWithParticipants.id, [User, Message]);
    });
}
