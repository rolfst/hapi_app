import { destructPayload } from 'services/payload';
import { postConversation } from 'services/conversation';

module.exports = (req, reply) => {
  const payload = destructPayload(['type', 'users'], req.payload);
  payload.users.push(req.auth.credentials.user.id);

  postConversation({
    type: payload.type.toUpperCase(),
    createdBy: req.auth.credentials.user.id,
    users: payload.users,
  })
    .then(data => reply(data))
    .catch(error => {
      reply(error);
    });
};
