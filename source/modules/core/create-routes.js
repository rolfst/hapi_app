import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'POST',
  url: '/v2/networks/{networkId}/integration/import',
  handler: require('./handlers/import-network'),
  strategy: 'integration',
  validator: require('./validators/import-network'),
}, {
  method: 'GET',
  url: '/v2/networks/{networkId}',
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
  method: 'GET',
  url: '/v2/networks/{networkId}/integration/admins',
  strategy: 'integration',
  handler: require('./handlers/network-admins'),
}];

export default createRoutes(routes);
