import Conversation from 'models/Conversation';

module.exports = (req, reply) => {
  Conversation.findAll().then(conversations => {
    reply({ data: conversations });
  });
};
