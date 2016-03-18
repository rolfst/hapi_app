import Boom from 'boom';
import { Conversation, User } from 'models';
import respondWithCollection from 'utils/respondWithCollection';
import messageSerializer from 'serializers/message';
import parseIncludes from 'utils/parseIncludes';

module.exports = (req, reply) => {
  const includes = parseIncludes(req.query);

  Conversation.findOne({
    where: { id: req.params.id },
  }).then(conversation => {
    if (!conversation) return reply(Boom.notFound('No conversation found for the given id.'));

    if (!conversation.hasUser(req.auth.credentials.user)) {
      return reply(Boom.forbidden('User doesn\'t belong to this conversation'));
    }

    return conversation.getMessages({
      include: [{ model: User, attributes: ['id'] }],
    });
  }).then(messages => {
    const response = respondWithCollection(messages, messageSerializer, {
      relations: ['user'],
    });

    return reply(response);
  });
};
