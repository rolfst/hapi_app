import validators from 'modules/chat/validators';

export default [
  {
    method: 'GET',
    path: '/v1/chats/users/me/conversations',
    handler: require('modules/chat/handlers/get-conversations'),
    config: {
      auth: 'jwt',
    },
  }, {
    method: 'GET',
    path: '/v1/chats/conversations/{id}',
    handler: require('modules/chat/handlers/get-conversation'),
    config: {
      validate: validators.conversation.detail,
      auth: 'jwt',
    },
  }, {
    method: 'GET',
    path: '/v1/chats/conversations/{id}/messages',
    handler: require('modules/chat/handlers/get-messages'),
    config: {
      auth: 'jwt',
    },
  }, {
    method: 'POST',
    path: '/v1/chats/conversations/{id}/messages',
    handler: require('modules/chat/handlers/post-message'),
    config: {
      validate: validators.message.create,
      auth: 'jwt',
    },
  }, {
    method: 'POST',
    path: '/v1/chats/conversations',
    handler: require('modules/chat/handlers/post-conversation'),
    config: {
      validate: validators.conversation.create,
      auth: 'jwt',
    },
  }, {
    method: 'DELETE',
    path: '/v1/chats/conversations/{id}',
    handler: require('modules/chat/handlers/delete-conversation'),
    config: {
      validate: validators.conversation.delete,
      auth: 'jwt',
    },
  },
];
