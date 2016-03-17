import Boom from 'boom';
import { Conversation } from 'models';
import { User } from 'models';
import respondWithCollection from 'utils/respondWithCollection';
import messageSerializer from 'serializers/message';

module.exports = (req, reply) => {
  Conversation.findOne({
    where: { id: req.params.id },
  }).then(conversation => {
    if (!conversation) return reply('Not found.');

    return conversation.hasUser(req.auth.credentials.user).then(result => {
      if (!result) return reply(Boom.forbidden('User doesn\'t belong to this conversation'));

      return conversation.getMessages({
        include: [{ model: User, attributes: ['id'] }],
      }).then(messages => {
        const response = respondWithCollection(messages, messageSerializer, {
          relations: ['user'],
        });

        return reply(response);
      });
    });
  });
};
