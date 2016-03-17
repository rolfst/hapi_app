import Conversation from 'models/Conversation';
import { destructPayload } from 'services/payload';

const values = ['type', 'users'];

module.exports = (req, reply) => {
  const payload = destructPayload(values, req.payload);

  reply(payload);

  /* Conversation.create({
    type: req.payload.type,
  }).then(conversation => {
    reply({ data: conversation });
  }).catch(error => {
    reply({ message: error.message, errors: error.errors });
  }); */
};
