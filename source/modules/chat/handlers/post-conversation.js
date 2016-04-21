import { postConversation } from 'common/services/conversation';

module.exports = (req, reply) => {
  const { type, users } = req.payload;
  users.push(req.auth.credentials.user.id);

  postConversation({
    type: type.toUpperCase(),
    createdBy: req.auth.credentials.user.id,
    users,
  })
    .then(data => reply(data))
    .catch(error => {
      reply(error);
    });
};
