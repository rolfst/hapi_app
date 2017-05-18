/* eslint-disable global-require */
const { createRoutes } = require('../../shared/utils/create-routes');

const routes = [{
  method: 'GET',
  url: '/v2/networks/{networkId}',
  handler: require('./handlers/view-network'),
}, {
  method: 'GET',
  url: '/v2/users/me/networks',
  handler: require('./handlers/networks-for-user'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/networks/{networkId}/teams',
  handler: require('./handlers/teams-for-network'),
}, {
  method: 'POST',
  url: '/v2/networks/{networkId}/teams',
  handler: require('./handlers/create-team'),
  validator: require('./validators/create-team'),
}, {
  method: 'PUT',
  url: '/v2/networks/{networkId}/teams/{teamId}',
  handler: require('./handlers/update-team'),
  validator: require('./validators/update-team'),
}, {
  method: 'POST',
  url: '/v2/seen_objects',
  handler: require('./handlers/seen-objects'),
  validator: require('./validators/seen-objects'),
  prefetch: false,
}];

const organisationRoutes = [{
  method: 'GET',
  url: '/v2/organisations/{organisationId}/networks',
  handler: require('./handlers/networks-for-organisation'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/users/me/organisations',
  handler: require('./handlers/organisations-for-user'),
  validator: require('./validators/organisations-for-user'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/organisations/{organisationId}/users/{userId}',
  handler: require('./handlers/view-user-in-organisation'),
  validator: require('./validators/view-user-in-organisation'),
  prefetch: false,
}, {
  method: 'PUT',
  url: '/v2/organisations/{organisationId}/users/{userId}',
  handler: require('./handlers/update-user-in-organisation'),
  validator: require('./validators/update-user-in-organisation'),
  prefetch: false,
}, {
  method: 'POST',
  url: '/v2/organisations/{organisationId}/users/{userId}/networks',
  handler: require('./handlers/add-user-to-networks'),
  validator: require('./validators/add-user-to-networks'),
  prefetch: false,
}, {
  method: 'PUT',
  url: '/v2/organisations/{organisationId}/users/{userId}/networks',
  handler: require('./handlers/update-user-in-networks'),
  validator: require('./validators/update-user-in-networks'),
  prefetch: false,
}, {
  method: 'DELETE',
  url: '/v2/organisations/{organisationId}/users/{userId}/networks',
  handler: require('./handlers/remove-user-from-networks'),
  validator: require('./validators/remove-user-from-networks'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/organisations/{organisationId}/users',
  handler: require('./handlers/users-in-organisation'),
  validator: require('./validators/users-in-organisation'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/organisations/{organisationId}',
  handler: require('./handlers/view-organisation'),
  prefetch: false,
}, {
  method: 'GET',
  url: '/v2/organisations/{organisationId}/functions',
  handler: require('./handlers/functions-in-organisation'),
  validator: require('./validators/functions-in-organisation'),
  prefetch: false,
}, {
  method: 'POST',
  url: '/v2/organisations/{organisationId}/functions',
  handler: require('./handlers/create-function-in-organisation'),
  validator: require('./validators/create-function-in-organisation'),
  prefetch: false,
}, {
  method: 'PUT',
  url: '/v2/organisations/{organisationId}/functions/{functionId}',
  handler: require('./handlers/update-function-in-organisation'),
  validator: require('./validators/update-function-in-organisation'),
  prefetch: false,
}, {
  method: 'DELETE',
  url: '/v2/organisations/{organisationId}/functions/{functionId}',
  handler: require('./handlers/remove-function-in-organisation'),
  validator: require('./validators/remove-function-in-organisation'),
  prefetch: false,
}];

const networkRoutes = [{
  method: 'PUT',
  url: '/v2/networks/{networkId}/users/{userId}',
  handler: require('./handlers/update-user-in-network'),
  validator: require('./validators/update-user-in-network'),
}];

module.exports = createRoutes([...routes, ...organisationRoutes, ...networkRoutes]);
