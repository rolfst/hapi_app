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
  url: '/v3/teams/{teamId}/feed',
  handler: require('./handlers/create-team-message'),
  validator: require('./validators/create-message'),
  prefetch: false,
}];

export default [...createRoutes(routes), {
  method: 'POST',
  path: '/v3/networks/{networkId}/feed',
  config: {
    payload: {
      maxBytes: 209715200,
      output: 'file',
      parse: true,
    },
    auth: 'jwt',
    handler: require('./handlers/create-network-message').default,
  },
}];
