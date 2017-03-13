import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v2/networks/{networkId}/statistics/created-messages',
  handler: require('./handlers/created-messages'),
  validator: require('./validators/events'),
}];

export default createRoutes(routes);
