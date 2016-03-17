import { conversation } from 'validators';
import { message } from 'validators';

export default [
  {
    method: 'GET',
    path: '/users/me/conversations',
    handler: require('handlers/getConversations'),
    config: {
      auth: 'default',
    },
  }, {
    method: 'GET',
    path: '/conversations/{id}',
    handler: require('handlers/getConversation'),
    config: {
      validate: conversation.detail,
      auth: 'default',
    },
  }, {
    method: 'GET',
    path: '/conversations/{id}/messages',
    handler: require('handlers/getMessages'),
    config: {
      auth: 'default',
    },
  }, {
    method: 'POST',
    path: '/conversations/{id}/messages',
    handler: require('handlers/createMessage'),
    config: {
      validate: message.create,
      auth: 'default',
    },
  }, {
    method: 'POST',
    path: '/conversations',
    handler: require('handlers/postConversation'),
    config: {
      validate: conversation.create,
      auth: 'default',
    },
  }, {
    method: 'DELETE',
    path: '/conversations/{id}',
    handler: require('handlers/deleteConversation'),
    config: {
      validate: conversation.delete,
      auth: 'default',
    },
  },
];
