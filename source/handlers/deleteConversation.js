import Conversation from 'models/Conversation';

module.exports = (req, reply) => {
  Conversation.findById(req.params.id).then(conversation => {
    reply(JSON.stringify({ data: conversation }));
  });
};
