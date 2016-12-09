import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'POST',
  url: '/v2/networks/{networkId}/integration_auth',
  handler: require('./handlers/integration-auth'),
  validator: require('./validators/authenticate'),
}, {
  method: 'GET',
  url: '/v2/integrations/sync',
  handler: require('./handlers/sync-with-integration-partner'),
  strategy: 'integration',
  prefetch: false,
}];

export default createRoutes(routes);
