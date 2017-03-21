import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v2/networks/{networkId}/statistics/{viewName}',
  handler: require('./handlers/statistics'),
  validator: require('./validators/statistics'),
}];

export default createRoutes(routes);
