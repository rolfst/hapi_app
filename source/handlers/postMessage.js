import Boom from 'boom';
import _ from 'lodash';
import fetch from 'isomorphic-fetch';
import { Conversation, Message } from 'models';
import messageFactory from 'factories/message';
import socket from 'services/socket';
import respondWithItem from 'utils/respondWithItem';
import messageSerializer from 'serializers/message';

module.exports = (req, reply) => {
  Conversation.findById(req.params.id)
    .then(conversation => {
      if (!conversation) throw Boom.notFound('No conversation found for id.');
      const createdMessage = messageFactory
        .buildForConversation(conversation.id, req.auth.credentials.user.id, req.payload.text)
        .save();

      return [ createdMessage, conversation.getUsers() ];
    }).spread((createdMessage, users) => {
      return [ Message.findById(createdMessage.id), users ];
    }).spread((message, users) => {
      const userIds = _.map(users, 'id');
      const response = respondWithItem(message, messageSerializer);
      
      socket.send('send-message', userIds, response, req.headers['x-api-token']);

      return reply(response);
    }).catch(error => {
      console.error(error);
      reply(error);
    });
};
