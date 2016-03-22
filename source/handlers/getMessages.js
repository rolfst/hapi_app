import Boom from 'boom';
import { Conversation } from 'models';
import respondWithCollection from 'utils/respondWithCollection';
import messageSerializer from 'serializers/message';

module.exports = (req, reply) => {
  Conversation.findById(req.params.id)
    .then(conversation => {
      if (!conversation) throw Boom.notFound('No conversation found for the given id.');

      if (!conversation.hasUser(req.auth.credentials.user)) {
        throw Boom.forbidden('User doesn\'t belong to this conversation');
      }

      return conversation.getMessages();
    }).then(messages => {
      const response = respondWithCollection(messages, messageSerializer);

      return reply(response);
    }).catch(boom => reply(boom));
};
