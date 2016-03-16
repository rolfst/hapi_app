import Conversation from 'models/Conversation';
import User from 'models/User';
import respondWithCollection from 'utils/respondWithCollection';
import messageSerializer from 'serializers/message';

module.exports = (req, reply) => {
  Conversation.findOne({
    where: { id: req.params.id },
  }).then(conversation => {
    if (!conversation) return reply('Not found.');

    conversation.getMessages({
      include: [{ model: User, attributes: ['id'] }],
    }).then(messages => {
      const response = respondWithCollection(messages, messageSerializer, {
        relations: ['user'],
      });

      return reply(response);
    });
  });
};
