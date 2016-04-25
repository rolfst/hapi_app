import Boom from 'boom';

import { Message, User, Conversation } from 'modules/chat/models';
import respondWithItem from 'common/utils/respond-with-item';

export function postConversation({ type, createdBy, users }) {
  return new Promise((resolve, reject) => {
    if (users.length < 2) reject(Boom.forbidden('Not enough conversation participants'));
    if (users[0] === users[1]) reject(Boom.forbidden('Can\'t start a conversation with yourself'));

    resolve();
  }).then(() => {
    return User.findById(createdBy);
  }).then(user => {
    return user.hasConversationWith(User, users);
  }).then(existingConversation => {
    if (existingConversation) {
      return Conversation.findById(existingConversation.id, { include: [User, Message] });
    }

    return Conversation.create({
      type,
      createdBy,
    }).then(newConversation => {
      return [newConversation, newConversation.addUsers(users)];
    }).spread(newConversation => {
      return Conversation.findById(newConversation.id, { include: [User, Message] });
    });
  }).then(conversation => {
    return respondWithItem(conversation, {
      relations: ['messages', 'users'],
    });
  });
}
