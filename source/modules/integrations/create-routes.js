import createRoutes from 'common/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v2/networks/{networkId}/import',
  handler: require('modules/integrations/handlers/import-network'),
  strategy: 'integration',
}, {
  method: 'POST',
  url: '/v2/networks/{networkId}/integration_auth',
  handler: require('modules/integrations/handlers/integration-auth'),
  validator: require('modules/integrations/validators/authenticate'),
}];

export default createRoutes(routes);
