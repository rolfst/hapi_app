import { Message, User, Conversation } from 'models';
import respondWithItem from 'utils/respondWithItem';
import conversationSerializer from 'serializers/conversation';

export function postConversation({ type, createdBy, users }) {
  return User.findById(createdBy).then(user => {
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
    return respondWithItem(conversation, conversationSerializer, {
      relations: ['messages', 'users'],
    });
  });
}
