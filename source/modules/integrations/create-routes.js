import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'POST',
  url: '/v2/networks/{networkId}/integration_auth',
  handler: require('./handlers/integration-auth'),
  validator: require('./validators/authenticate'),
}];

export default createRoutes(routes);
