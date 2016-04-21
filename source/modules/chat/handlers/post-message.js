import Boom from 'boom';
import { Conversation, Message, User } from 'modules/chat/models';
import messageFactory from 'modules/chat/factories/message';
import notifier from 'common/services/notifier';
import socket from 'common/services/socket';
import respondWithItem from 'common/utils/respond-with-item';
import messageSerializer from 'modules/chat/serializers/message';

module.exports = (req, reply) => {
  const loggedUser = req.auth.credentials.user;

  Conversation.findById(req.params.id)
    .then(conversation => {
      if (!conversation) throw Boom.notFound('No conversation found for id.');
      const createdMessage = messageFactory
        .buildForConversation(conversation.id, req.auth.credentials.user.id, req.payload.text)
        .save();

      return [createdMessage, conversation.getUsers()];
    }).spread((createdMessage, users) => {
      return [Message.findById(createdMessage.id, { include: [Conversation, User] }), users];
    }).spread((message, users) => {
      const ids = users.filter(user => user.id !== loggedUser.id).map(user => user.id);
      const emails = users.filter(user => user.id !== loggedUser.id).map(user => user.email);
      const response = respondWithItem(message, messageSerializer);

      notifier.sendForMessage(message.Conversation.id, emails, message);
      socket.send('send-message', ids, response, req.headers['x-api-token']);

      return reply(response);
    }).catch(error => {
      console.error(error);
      reply(error);
    });
};
