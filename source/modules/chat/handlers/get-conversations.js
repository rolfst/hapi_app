import _ from 'lodash';
import { User, Message } from 'modules/chat/models';
import conversationSerializer from 'modules/chat/serializers/conversation';
import respondWithCollection from 'common/utils/respond-with-collection';
import parseIncludes from 'common/utils/parse-includes';

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
