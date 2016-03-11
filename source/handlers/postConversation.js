import Conversation from 'models/Conversation';
import { destructPayload } from 'services/payload';

const values = ['type', 'users'];

module.exports = (req, reply) => {
  Conversation.create(destructPayload(values, req.payload)).then(conversation => {
    reply(JSON.stringify({ data: conversation }));
  }).catch(error => {
    reply(JSON.stringify({ message: error.message, errors: error.errors }));
  });
};
