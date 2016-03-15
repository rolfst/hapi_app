import Conversation from 'models/Conversation';

module.exports = (req, reply) => {
  Conversation.findOne({
    where: { id: req.params.id },
  }).then(conversation => {
    if (!conversation) reply('Not found.');

    conversation.getMessages().then(messages => {
      reply({ data: messages });
    });
  });
};
