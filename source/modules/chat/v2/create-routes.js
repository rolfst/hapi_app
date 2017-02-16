import createRoutes from '../../../shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v2/users/me/conversations',
  handler: require('./handlers/get-conversations'),
  validator: require('./validators/get-conversation'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/conversations/{conversationId}/messages',
  handler: require('./handlers/get-messages'),
  validator: require('./validators/get-messages'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/conversations/{conversationId}',
  handler: require('./handlers/get-conversation'),
  prefetch: false,
}, {
  method: 'POST',
  url: '/v2/conversations',
  handler: require('./handlers/create-conversation'),
  validator: require('./validators/create-conversation'),
  prefetch: false,
}, {
  method: 'POST',
  url: '/v2/conversations/{conversationId}/messages',
  handler: require('./handlers/create-message'),
  validator: require('./validators/create-message'),
  prefetch: false,
  payload: {
    maxBytes: 10000000,
    output: 'file',
    parse: true,
  },
}];

export default createRoutes(routes);
