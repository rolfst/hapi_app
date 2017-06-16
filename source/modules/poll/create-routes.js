/* eslint-disable global-require */
const { createRoutes } = require('../../shared/utils/create-routes');
const { ERoutePermissions } = require('../authorization/definitions');

const routes = [{
  method: 'POST',
  url: '/v2/networks/{networkId}/polls/{pollId}/vote',
  handler: require('./handlers/vote'),
  validator: require('./validators/vote'),
  permissions: ERoutePermissions.NETWORK_USER,
}];

module.exports = createRoutes(routes);
