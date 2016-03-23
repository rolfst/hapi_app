import { destructPayload } from 'services/payload';
import { Message, User, Conversation } from 'models';
import respondWithItem from 'utils/respondWithItem';
import conversationSerializer from 'serializers/conversation';

const values = ['type', 'users'];

module.exports = (req, reply) => {
  const payload = destructPayload(values, req.payload);
  payload.users.push(req.auth.credentials.user.id);

  User.findById(req.auth.credentials.user.id).then(user => {
    return user.hasConversationWith(User, payload.users);
  }).then(existingConversation => {
    if (existingConversation) {
      return Conversation.findById(existingConversation.id, { include: [User, Message] });
    }

    return Conversation.create({
      type: payload.type.toUpperCase(),
      createdBy: req.auth.credentials.user.id,
    }).then(newConversation => {
      return [newConversation, newConversation.addUsers(payload.users)];
    }).spread(newConversation => {
      return Conversation.findById(newConversation.id, { include: [User, Message] });
    });
  }).then(conversation => {
    return reply(respondWithItem(conversation, conversationSerializer, {
      relations: ['messages', 'users'],
    }));
  }).catch(error => {
    reply(error);
  });
};
