import respondWithItem from 'common/utils/respond-with-item';
import { createConversation } from 'modules/chat/repositories/conversation';

module.exports = (req, reply) => {
  const { type, users } = req.payload;
  users.push(req.auth.credentials.id);

  createConversation(type, req.auth.credentials.id, users)
    .then(conversation => reply(respondWithItem(conversation)))
    .catch(boom => reply(boom));
};
