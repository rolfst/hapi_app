import Boom from 'boom';
import { Conversation, Message } from 'models';
import messageFactory from 'factories/message';
import notifier from 'services/notifier';
import socket from 'services/socket';
import respondWithItem from 'utils/respondWithItem';
import messageSerializer from 'serializers/message';

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
      return [Message.findById(createdMessage.id, { include: [Conversation] }), users];
    }).spread((message, users) => {
      const ids = users.filter(user => user.id !== loggedUser.id).map(user => user.id);
      const emails = users.filter(user => user.id !== loggedUser.id).map(user => user.email);
      const response = respondWithItem(message, messageSerializer);

      notifier.sendForMessage(message.id, message.parentId.toString(), emails, message.text);
      socket.send('send-message', ids, response, req.headers['x-api-token']);

      return reply(response);
    }).catch(error => {
      console.error(error);
      reply(error);
    });
};
