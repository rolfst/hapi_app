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
}, {
  method: 'GET',
  url: '/v2/networks/{networkId}/teams',
  handler: require('./handlers/teams-for-network'),
}, {
  method: 'POST',
  url: '/v2/networks/{networkId}/teams',
  handler: require('./handlers/create-team'),
  validator: require('./validators/create-team'),
}, {
  method: 'PUT',
  url: '/v2/networks/{networkId}/teams/{teamId}',
  handler: require('./handlers/update-team'),
  validator: require('./validators/update-team'),
}];

export default createRoutes(routes);
