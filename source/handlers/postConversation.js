import { destructPayload } from 'services/payload';
import { Message, User, Conversation } from 'models';
import respondWithItem from 'utils/respondWithItem';
import conversationSerializer from 'serializers/conversation';

const values = ['type', 'users'];

module.exports = (req, reply) => {
  const payload = destructPayload(values, req.payload);
  payload.users.push(req.auth.credentials.user.id);

  Conversation.create({
    type: payload.type.toUpperCase(),
    createdBy: req.auth.credentials.user.id,
  }).then(conversation => {
    return conversation.addUsers(payload.users).then(() => {
      return Conversation.findById(conversation.id, { include: [User, Message] });
    });
  }).then(conversation => {
    return reply(respondWithItem(conversation, conversationSerializer, {
      relations: ['messages', 'users'],
    }));
  }).catch(error => {
    reply({ message: error.message, errors: error.errors });
  });
};
