import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v1/networks/{networkId}',
  handler: require('./handlers/view-network'),
}, {
  method: 'GET',
  url: '/v2/users/me/networks',
  handler: require('./handlers/networks-for-user'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/pristine_networks',
  handler: require('./handlers/pristine-networks'),
  prefetch: false,
}, {
  method: 'POST',
  url: '/v2/pristine_networks/import',
  handler: require('./handlers/import-pristine-network'),
  validator: require('./validators/import-pristine-network'),
}];

export default createRoutes(routes);
