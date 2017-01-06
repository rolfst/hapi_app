import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v2/networks/{networkId}/timeline',
  handler: require('./handlers/get-network-timeline'),
}, {
  method: 'GET',
  url: '/v2/teams/{teamId}/timeline',
  handler: require('./handlers/get-team-timeline'),
}, {
  method: 'POST',
  url: '/v2/networks/{networkId}/timeline',
  handler: require('./handlers/create-network-message'),
}, {
  method: 'POST',
  url: '/v2/teams/{teamId}/timeline',
  handler: require('./handlers/create-team-message'),
}];

export default createRoutes(routes);
