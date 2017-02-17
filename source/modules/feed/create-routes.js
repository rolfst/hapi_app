import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v3/networks/{networkId}/feed',
  handler: require('./handlers/get-network-feed'),
  validator: require('./validators/get-feed'),
}, {
  method: 'GET',
  url: '/v3/teams/{teamId}/feed',
  handler: require('./handlers/get-team-feed'),
  validator: require('./validators/get-feed'),
  prefetch: false,
}, {
  method: 'POST',
  url: '/v3/networks/{networkId}/feed',
  handler: require('./handlers/create-network-message'),
  validator: require('./validators/create-message'),
  payload: {
    maxBytes: 10000000,
    output: 'file',
    parse: true,
  },
}, {
  method: 'POST',
  url: '/v3/teams/{teamId}/feed',
  handler: require('./handlers/create-team-message'),
  validator: require('./validators/create-message'),
  prefetch: false,
  payload: {
    maxBytes: 10000000,
    output: 'file',
    parse: true,
  },
}];

export default createRoutes(routes);
