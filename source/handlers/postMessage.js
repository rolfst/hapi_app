import Boom from 'boom';
import fetch from 'isomorphic-fetch';
import { Conversation, Message } from 'models';
import messageFactory from 'factories/message';
import socket from 'services/socket';
import respondWithItem from 'utils/respondWithItem';
import messageSerializer from 'serializers/message';

module.exports = (req, reply) => {
  Conversation.findById(req.params.id).then(conversation => {
    if (!conversation) throw Boom.notFound('No conversation found for id.');

    return messageFactory
      .buildForConversation(conversation.id, req.auth.credentials.user.id, req.payload.text)
      .save()
      .then(createdMessage => Message.findById(createdMessage.id))
      .then(message => {
        socket.send('send-message', { message: message.text }, req.headers['x-api-token']);

        return reply(respondWithItem(message, messageSerializer));
      });
  }).catch(error => {
    console.error(error);
    reply(error);
  });
};
