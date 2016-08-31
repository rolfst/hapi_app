import createRoutes from 'common/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v1/chats/users/me/conversations',
  handler: require('modules/chat/handlers/get-conversations'),
  validator: require('modules/chat/validators/get-conversation'),
}, {
  method: 'GET',
  url: '/v1/chats/conversations/{id}',
  handler: require('modules/chat/handlers/get-conversation'),
  validator: require('modules/chat/validators/get-conversation'),
}, {
  method: 'GET',
  url: '/v1/chats/conversations/{id}/messages',
  handler: require('modules/chat/handlers/get-messages'),
}, {
  method: 'POST',
  url: '/v1/chats/conversations/{id}/messages',
  handler: require('modules/chat/handlers/post-message'),
  validator: require('modules/chat/validators/create-message'),
}, {
  method: 'POST',
  url: '/v1/chats/conversations',
  handler: require('modules/chat/handlers/post-conversation'),
  validator: require('modules/chat/validators/create-conversation'),
}, {
  method: 'DELETE',
  url: '/v1/chats/conversations/{id}',
  handler: require('modules/chat/handlers/delete-conversation'),
}];

const addPrefetchValue = (route) => ({ ...route, prefetch: false });

export default createRoutes(routes.map(addPrefetchValue));
