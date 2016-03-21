import { User } from 'models';
import respondWithCollection from 'utils/respondWithCollection';
import conversationSerializer from 'serializers/conversation';

module.exports = (req, reply) => {
  User.findById(req.auth.credentials.user.id)
    .then(user => {
      return user.getConversations()
    })
    .then(conversations => {
      const response = respondWithCollection(conversations, conversationSerializer);

      reply(response);
    });
};
