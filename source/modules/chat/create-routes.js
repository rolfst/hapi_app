const routes = [{
  method: 'GET',
  path: '/v1/chats/users/me/conversations',
  handler: require('modules/chat/handlers/get-conversations'),
  config: {
    auth: 'jwt',
    validate: require('modules/chat/validators/get-conversation').default,
  },
}, {
  method: 'GET',
  path: '/v1/chats/conversations/{id}',
  handler: require('modules/chat/handlers/get-conversation'),
  config: {
    auth: 'jwt',
    validate: require('modules/chat/validators/get-conversation').default,
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
    auth: 'jwt',
    validate: require('modules/chat/validators/create-message').default,
  },
}, {
  method: 'POST',
  path: '/v1/chats/conversations',
  handler: require('modules/chat/handlers/post-conversation'),
  config: {
    auth: 'jwt',
    validate: require('modules/chat/validators/create-conversation').default,
  },
}, {
  method: 'DELETE',
  path: '/v1/chats/conversations/{id}',
  handler: require('modules/chat/handlers/delete-conversation'),
  config: {
    auth: 'jwt',
  },
}];

export default routes;
