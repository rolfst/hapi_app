import Boom from 'boom';
import { Message, User, Conversation } from 'models';
import respondWithItem from 'utils/respondWithItem';
import conversationSerializer from 'serializers/conversation';

module.exports = (req, reply) => {
  Conversation.findById(req.params.id, {
    include: [{ model: Message, attributes: ['id'] }, { model: User, attributes: ['id'] }],
  }).then(conversation => {
    conversation.hasUser(req.auth.credentials.user).then(result => {
      if (!result) return reply(Boom.forbidden('User doesn\'t belong to this conversation'));

      return reply(respondWithItem(conversation, conversationSerializer, {
        relations: ['messages', 'users'],
      }));
    });
  });
};
