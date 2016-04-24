import { postConversation } from 'common/services/conversation';
import respondWithItem from 'common/utils/respond-with-item';
import conversationSerializer from 'modules/chat/serializers/conversation';

module.exports = (req, reply) => {
  const { type, users } = req.payload;
  users.push(req.auth.credentials.user.id);

  postConversation({
    type: type.toUpperCase(),
    createdBy: req.auth.credentials.user.id,
    users,
  })
    .then(conversation => {
      return respondWithItem(conversation, conversationSerializer, {
        relations: ['messages', 'users'],
      });
    })
    .then(data => reply(data))
    .catch(error => {
      reply(error);
    });
};
