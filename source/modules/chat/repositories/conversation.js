import Boom from 'boom';
import User from 'common/models/user';
import Conversation from 'modules/chat/models/conversation';
import Message from 'modules/chat/models/message';

export function deleteConversationById(id) {
  return Conversation
    .findById(id)
    .then(conversation => {
      if (!conversation) return Boom.notFound('No conversation found.');

      return conversation.destroy()
    })
    .catch(err => Boom.badRequest(err));
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

export function createConversation(type, creator, participants) {
  if (participants.length < 2) return Boom.forbidden('A conversation must have 2 or more participants');
  if (participants[0] === participants[1]) return Boom.forbidden('You cannot create a conversation with yourself')

  // TODO: Add acl to check if user already has a conversation with a participant
  return Conversation.create({ type: type.toUpperCase(), createdBy: creator.id })
    .then(createdConversation => {
      return [createdConversation, createdConversation.addUsers(participants)];
    })
    .spread(conversationWithParticipants => {
      return findConversationById(conversationWithParticipants.id, [User, Message]);
    });
  // return new Promise((resolve, reject) => {
  //   if (users.length < 2) reject(Boom.forbidden('Not enough conversation participants'));
  //   if (users[0] === users[1]) reject(Boom.forbidden('Can\'t start a conversation with yourself'));
  //
  //   resolve();
  // }).then(() => {
  //   return User.findById(createdBy);
  // }).then(user => {
  //   return user.hasConversationWith(User, users);
  // }).then(existingConversation => {
  //   if (existingConversation) {
  //     return Conversation.findById(existingConversation.id, { include: [User, Message] });
  //   }
  //
  //   return Conversation.create({
  //     type,
  //     createdBy,
  //   }).then(newConversation => {
  //     return [newConversation, newConversation.addUsers(users)];
  //   }).spread(newConversation => {
  //     return Conversation.findById(newConversation.id, { include: [User, Message] });
  //   });
  // }).then(conversation => {
  //   return respondWithItem(conversation, {
  //     relations: ['messages', 'users'],
  //   });
  // });
}
