import Boom from 'boom';
import _ from 'lodash';
import { Message, Conversation } from 'models';
import respondWithItem from 'utils/respondWithItem';
import conversationSerializer from 'serializers/conversation';
import parseIncludes from 'utils/parseIncludes';

module.exports = (req, reply) => {
  const includes = parseIncludes(req.query);

  const modelIncludes = [];

  if (_.includes(includes, 'messages')) {
    modelIncludes.push({ model: Message });
  }

  Conversation.findById(req.params.id, { include: modelIncludes })
    .then(conversation => {
      return [conversation.hasUser(req.auth.credentials.user), conversation];
    }).spread((hasUser, conversation) => {
      if (!hasUser) {
        throw Boom.forbidden('User doesn\'t belong to this conversation');
      }

      return reply(respondWithItem(conversation, conversationSerializer));
    }).catch(boom => {
      console.log(boom);
      reply(boom);
    });
};
