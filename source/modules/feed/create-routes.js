/* eslint-disable global-require */
const { createRoutes } = require('../../shared/utils/create-routes');

const routes = [{
  method: 'GET',
  url: '/v3/networks/{networkId}/feed',
  handler: require('./handlers/get-network-feed'),
  validator: require('./validators/get-feed'),
}, {
  method: 'GET',
  url: '/v3/organisations/{organisationId}/news',
  handler: require('./handlers/get-organisation-feed'),
  validator: require('./validators/get-feed'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v3/teams/{teamId}/feed',
  handler: require('./handlers/get-team-feed'),
  validator: require('./validators/get-feed'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v3/organisations/{organisationId}/feed',
  handler: require('./handlers/get-cantina-feed'),
  validator: require('./validators/get-feed'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/messages/{messageId}',
  handler: require('./handlers/get-message'),
  validator: require('./validators/get-message'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/messages/{messageId}/likes',
  handler: require('./handlers/get-likes'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/messages/{messageId}/comments',
  handler: require('./handlers/get-comments'),
  validator: require('./validators/get-comments'),
  prefetch: false,
}, {
  method: 'POST',
  url: '/v3/networks/{networkId}/feed',
  handler: require('./handlers/create-network-message'),
  validator: require('./validators/create-message'),
}, {
  method: 'POST',
  url: '/v3/teams/{teamId}/feed',
  handler: require('./handlers/create-team-message'),
  validator: require('./validators/create-message'),
  prefetch: false,
}, {
  method: 'POST',
  url: '/v2/messages/{messageId}/comments',
  handler: require('./handlers/create-comment'),
  validator: require('./validators/create-comment'),
  prefetch: false,
}, {
  method: 'PUT',
  url: '/v3/messages/{messageId}',
  handler: require('./handlers/update-message'),
  validator: require('./validators/update-message'),
  prefetch: false,
}];

const organisationMessageRoutes = [{
  method: 'GET',
  url: '/v2/organisations/{organisationId}/messages',
  handler: require('./handlers/get-organisation-messages'),
  validator: require('./validators/get-organisation-messages'),
  prefetch: false,
}, {
  method: 'POST',
  url: '/v2/organisations/{organisationId}/messages',
  handler: require('./handlers/create-organisation-message'),
  validator: require('./validators/create-organisation-message'),
  prefetch: false,
}];

module.exports = createRoutes([...routes, ...organisationMessageRoutes]);
