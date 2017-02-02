import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'POST',
  url: '/v2/networks/{networkId}/polls/{pollId}/vote',
  handler: require('./handlers/vote'),
  validator: require('./validators/vote'),
}];

export default createRoutes(routes);
