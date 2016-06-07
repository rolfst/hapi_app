import respondWithItem from 'common/utils/respond-with-item';
import { User } from 'common/models';
import { findConversationById, createConversation } from 'modules/chat/repositories/conversation';

module.exports = (req, reply) => {
  const { type, users } = req.payload;
  users.push(req.auth.credentials.id);

  createConversation(type, req.auth.credentials.id, users)
    .then(conversation => findConversationById(conversation.id, [{ model: User }]))
    .then(conversation => reply(respondWithItem(conversation)))
    .catch(boom => reply(boom));
};
