import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'POST',
  url: '/v2/networks/{networkId}/integration_auth',
  handler: require('./handlers/integration-auth'),
  validator: require('./validators/authenticate'),
}, {
  method: 'POST',
  url: '/v2/networks/{networkId}/integration/import',
  handler: require('./handlers/import-network'),
  strategy: 'integration',
  validator: require('./validators/import-network'),
}, {
  method: 'GET',
  url: '/v2/networks/sync',
  handler: require('./handlers/sync-with-integration-partner'),
  strategy: 'integration',
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/networks/{networkId}/sync',
  handler: require('./handlers/sync-network-with-integration-partner'),
  strategy: 'integration',
}];

export default createRoutes(routes);
