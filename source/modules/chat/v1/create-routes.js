const createRoutes = require('../../../shared/utils/create-routes');

const routes = [{
  method: 'GET',
  url: '/v1/chats/users/me/conversations',
  handler: require('./handlers/get-conversations'),
  validator: require('./validators/get-conversation'),
}, {
  method: 'GET',
  url: '/v1/chats/conversations/{id}',
  handler: require('./handlers/get-conversation'),
  validator: require('./validators/get-conversation'),
}, {
  method: 'GET',
  url: '/v1/chats/conversations/{id}/messages',
  handler: require('./handlers/get-messages'),
}, {
  method: 'POST',
  url: '/v1/chats/conversations/{id}/messages',
  handler: require('./handlers/post-message'),
  validator: require('./validators/create-message'),
}, {
  method: 'POST',
  url: '/v1/chats/conversations',
  handler: require('./handlers/post-conversation'),
  validator: require('./validators/create-conversation'),
}, {
  method: 'DELETE',
  url: '/v1/chats/conversations/{id}',
  handler: require('./handlers/delete-conversation'),
}];

const addPrefetchValue = (route) => ({ ...route, prefetch: false });

module.exports = createRoutes(routes.map(addPrefetchValue));
