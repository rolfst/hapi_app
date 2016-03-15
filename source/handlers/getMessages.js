import Conversation from 'models/Conversation';
import respondWithCollection from 'utils/respondWithCollection';
import messageSerializer from 'serializers/message';

module.exports = (req, reply) => {
  Conversation.findOne({
    where: { id: req.params.id },
  }).then(conversation => {
    if (!conversation) reply('Not found.');

    conversation.getMessages().then(messages => {
      reply(respondWithCollection(messages, messageSerializer));
    });
  });
};
