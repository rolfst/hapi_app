import Conversation from 'models/Conversation';

module.exports = (req, reply) => {
  Conversation.find(
    {
      where: { id: req.params.id },
    }
  ).then(conversation => {
    reply({ data: conversation });
  });
};
