import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v3/networks/{networkId}/timeline',
  handler: require('./handlers/get-network-feed'),
}, {
  method: 'GET',
  url: '/v3/teams/{teamId}/timeline',
  handler: require('./handlers/get-team-feed'),
  prefetch: false,
}, {
  method: 'POST',
  url: '/v3/networks/{networkId}/timeline',
  handler: require('./handlers/create-network-message'),
  validator: require('./validators/create-message'),
}, {
  method: 'POST',
  url: '/v3/teams/{teamId}/timeline',
  handler: require('./handlers/create-team-message'),
  validator: require('./validators/create-message'),
  prefetch: false,
}];

export default createRoutes(routes);
