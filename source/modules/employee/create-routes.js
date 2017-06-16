/* eslint-disable global-require, import/no-dynamic-require */
const { createRoutes } = require('../../shared/utils/create-routes');
const { ERoutePermissions } = require('../authorization/definitions');

const baseImport = './handlers';
const basePath = '/v2/networks/{networkId}';

const routes = [{
  method: 'GET',
  url: `${basePath}/users/me`,
  handler: require(`${baseImport}/view-my-profile`),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'GET',
  url: '/v2/users/me',
  handler: require(`${baseImport}/view-my-scoped-profile`),
  permissions: ERoutePermissions.NONE,
  prefetch: false,
}, {
  method: 'PUT',
  url: `${basePath}/users/me`,
  handler: require(`${baseImport}/update-my-profile`),
  validator: require('./validators/update-user'),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'POST',
  url: `${basePath}/users`,
  handler: require(`${baseImport}/invite-user`),
  validator: require('./validators/create-user'),
  permissions: ERoutePermissions.NETWORK_ADMIN,
}, {
  method: 'POST',
  url: '/v2/organisations/{organisationId}/users',
  handler: require(`${baseImport}/invite-user-to-organisation`),
  validator: require('./validators/create-user-in-organisation'),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}, {
  method: 'POST',
  url: `${basePath}/users/invite`,
  handler: require(`${baseImport}/bulk-invite-users`),
  validator: require('./validators/bulk-invite'),
  permissions: ERoutePermissions.NETWORK_ADMIN,
}];

module.exports = createRoutes(routes);
