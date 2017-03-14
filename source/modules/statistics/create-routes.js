import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v2/networks/{networkId}/statistics/{viewName}',
  handler: require('./handlers/events'),
  validator: require('./validators/events'),
}];

export default createRoutes(routes);
