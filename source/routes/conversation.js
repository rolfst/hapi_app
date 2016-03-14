import { conversation } from 'validators';

export default [
  {
    method: 'GET',
    path: '/conversations',
    handler: require('handlers/getConversations'),
  }, {
    method: 'GET',
    path: '/conversations/{id}',
    handler: require('handlers/getConversation'),
    config: {
      validate: conversation.detail,
    },
  }, {
    method: 'POST',
    path: '/conversations',
    handler: require('handlers/postConversation'),
    config: {
      validate: conversation.create,
    },
  }, {
    method: 'DELETE',
    path: '/conversations/{id}',
    handler: require('handlers/deleteConversation'),
    config: {
      validate: conversation.delete,
    },
  },
];
