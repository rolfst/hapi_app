import { deleteConversationById } from '../repositories/conversation';

module.exports = (req, reply) => {
  return deleteConversationById(req.params.id)
    .then(() => reply({ success: true }))
    .catch(boom => reply(boom));
};
