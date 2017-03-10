import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v2/networks/{networkId}/statistics/createdmessages',
  handler: require('./handlers/created-messages'),
  validator: require('./validators/events'),
}];

export default createRoutes(routes);
