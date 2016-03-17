import { User } from 'models';
import respondWithCollection from 'utils/respondWithCollection';
import conversationSerializer from 'serializers/conversation';

module.exports = (req, reply) => {
  User.findById(req.auth.credentials.user.id).then(user => {
    user.getConversations({
      include: [User],
    }).then(conversations => {
      reply(respondWithCollection(conversations, conversationSerializer, {
        relations: ['users'],
      }));
    });
  });
};
