import Conversation from 'models/Conversation';

module.exports = (req, reply) => {
  Conversation.create({
    type: req.payload.type,
  }).then(conversation => {
    reply({ data: conversation });
  }).catch(error => {
    reply({ message: error.message, errors: error.errors });
  });
};
