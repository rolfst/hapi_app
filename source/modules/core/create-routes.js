/* eslint-disable global-require */
const { createRoutes } = require('../../shared/utils/create-routes');

const routes = [{
  method: 'GET',
  url: '/v2/organisations/{organisationId}/networks',
  handler: require('./handlers/networks-for-organisation'),
  prefetch: false,
}, {
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
  url: '/v2/users/me/organisations',
  handler: require('./handlers/organisations-for-user'),
  validator: require('./validators/organisations-for-user'),
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
  url: '/v2/objects/{objectId}/read',
  handler: require('./handlers/read-object'),
  validator: require('./validators/read-object'),
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
  url: '/v2/organisations/{organisationId}/functions/{organisationFunctionId}',
  handler: require('./handlers/update-function-in-organisation'),
  validator: require('./validators/update-function-in-organisation'),
  prefetch: false,
}, {
  method: 'DELETE',
  url: '/v2/organisations/{organisationId}/functions/{organisationFunctionId}',
  handler: require('./handlers/remove-function-in-organisation'),
  validator: require('./validators/remove-function-in-organisation'),
  prefetch: false,
}];

module.exports = createRoutes(routes);
