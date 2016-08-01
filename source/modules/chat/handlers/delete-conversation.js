import { deleteConversationById } from 'modules/chat/repositories/conversation';

module.exports = (req, reply) => {
  return deleteConversationById(req.params.id)
    .then(() => reply({ success: true, message: 'Successfully deleted conversation' }))
    .catch(boom => reply(boom));
};
