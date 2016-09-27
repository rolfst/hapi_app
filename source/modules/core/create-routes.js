import createRoutes from 'shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v2/users/me/networks',
  handler: require('./handlers/networks-for-user'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/pristine_networks',
  handler: require('./handlers/pristine-networks'),
  prefetch: false,
}];

export default createRoutes(routes);
