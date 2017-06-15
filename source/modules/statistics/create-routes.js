/* eslint-disable global-require */
const { createRoutes } = require('../../shared/utils/create-routes');
const { ERoutePermissions } = require('../authorization/definitions');

const routes = [{
  method: 'GET',
  url: '/v2/networks/{networkId}/statistics',
  handler: require('./handlers/statistics'),
  validator: require('./validators/statistics'),
  permissions: ERoutePermissions.NETWORK_ADMIN,
}];

module.exports = createRoutes(routes);
