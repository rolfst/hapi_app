import createRoutes from 'common/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v2/networks/{networkId}/import',
  handler: require('modules/integrations/handlers/import-network'),
  strategy: 'integration',
}];

export default createRoutes(routes);
