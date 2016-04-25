import respondWithItem from 'common/utils/respond-with-item';
import { createConversation } from 'modules/chat/repositories/conversation';

module.exports = (req, reply) => {
  const { type, users } = req.payload;
  users.push(req.auth.credentials.user.id);

  createConversation(type, req.auth.credentials.user, users)
    .then(conversation => reply(respondWithItem(conversation)))
    .catch(boom => reply(boom));
};
