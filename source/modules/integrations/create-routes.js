import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v2/networks/{networkId}/import',
  handler: require('./handlers/import-network'),
  strategy: 'integration',
}, {
  method: 'POST',
  url: '/v2/networks/{networkId}/integration_auth',
  handler: require('./handlers/integration-auth'),
  validator: require('./validators/authenticate'),
}];

export default createRoutes(routes);
