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
}];

export default createRoutes(routes);
