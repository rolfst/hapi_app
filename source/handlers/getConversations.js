import _ from 'lodash';
import { User, Message } from 'models';
import respondWithCollection from 'utils/respondWithCollection';
import conversationSerializer from 'serializers/conversation';
import parseIncludes from 'utils/parseIncludes';

module.exports = (req, reply) => {
  const includes = parseIncludes(req.query);

  const modelIncludes = [];

  if (_.includes(includes, 'messages')) {
    modelIncludes.push({ model: Message });
  }

  User.findById(req.auth.credentials.user.id)
    .then(user => {
      return user.getConversations({ include: modelIncludes });
    })
    .then(conversations => {
      const response = respondWithCollection(conversations, conversationSerializer);

      reply(response);
    });
};
