import { Conversation, User } from 'modules/chat/models';
import notifier from 'common/services/notifier';
import socket from 'common/services/socket';
import respondWithItem from 'common/utils/respond-with-item';
import { findConversationById } from 'modules/chat/repositories/conversation';
import { findMessageById, createMessage } from 'modules/chat/repositories/message';

module.exports = (req, reply) => {
  const loggedUser = req.auth.credentials;

  return findConversationById(req.params.id)
    .then(conversation => {
      const createdMessage = createMessage(conversation.id, loggedUser.id, req.payload.text);
      return [createdMessage, conversation.getUsers()];
    })
    .spread((createdMessage, participants) => {
      return findMessageById(createdMessage.id, [Conversation, User])
        .then(message => {
          const usersToNotify = participants.filter(user => user.id !== loggedUser.id);
          notifier.sendForMessage(usersToNotify, message);

          const response = respondWithItem(message);
          socket.send('send-message', usersToNotify, response, req.headers['x-api-token']);

          return reply(response);
        });
    });
};
