import { Conversation } from 'models';

module.exports = (req, reply) => {
  Conversation.findById(req.params.id).then(conversation => {
    reply({ data: conversation });
  });
};
