import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v2/networks/{networkId}/feed',
  handler: require('./handlers/get-network-feed'),
}, {
  method: 'GET',
  url: '/v2/teams/{teamId}/feed',
  handler: require('./handlers/get-team-feed'),
  prefetch: false,
}, {
  method: 'POST',
  url: '/v2/networks/{networkId}/feed',
  handler: require('./handlers/create-network-message'),
}, {
  method: 'POST',
  url: '/v2/teams/{teamId}/feed',
  handler: require('./handlers/create-team-message'),
}];

export default createRoutes(routes);
