import { Users } from 'models/ConversationUser';
import Conversation from 'models/Conversation';

module.exports = (req, reply) => {
  Conversation.create({
    type: req.payload.type,
    Users: [
      { id: 1 },
    ],
  }, { include: [Users] }).then(conversation => {
    reply({ data: conversation });
  }).catch(error => {
    reply({ message: error.message, errors: error.errors });
  });
};
