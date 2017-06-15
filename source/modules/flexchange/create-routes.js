/* eslint-disable global-require, import/no-dynamic-require */
const { createRoutes } = require('../../shared/utils/create-routes');
const { ERoutePermissions } = require('../authorization/definitions');

const basePath = './handlers';
const baseUrl = '/v2/networks/{networkId}';

const routes = [{
  method: 'GET',
  url: `${baseUrl}/users/me/shifts`,
  handler: require(`${basePath}/my-shifts`),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'GET',
  url: `${baseUrl}/shifts/{shiftId}/available`,
  handler: require(`${basePath}/available-users-for-shift`),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'GET',
  url: `${baseUrl}/shifts/{shiftId}`,
  handler: require(`${basePath}/view-shift`),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'GET',
  url: `${baseUrl}/users/me/exchanges`,
  handler: require(`${basePath}/my-exchanges`),
  validator: require('./validators/get-exchange'),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'GET',
  url: `${baseUrl}/users/me/exchanges/responded_to`,
  handler: require(`${basePath}/responded-to`),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'GET',
  url: `${baseUrl}/users/me/exchanges/accepted`,
  handler: require(`${basePath}/my-accepted-exchanges`),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'GET',
  url: `${baseUrl}/exchanges`,
  handler: require(`${basePath}/all-exchanges-for-network`),
  validator: require('./validators/get-exchange'),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'GET',
  url: `${baseUrl}/exchanges/{exchangeId}`,
  handler: require(`${basePath}/view-exchange`),
  validator: require('./validators/get-exchange'),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'GET',
  url: `${baseUrl}/exchanges/{exchangeId}/users`,
  handler: require(`${basePath}/users-for-exchange`),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'GET',
  url: `${baseUrl}/exchanges/{exchangeId}/activity_feed`,
  handler: require(`${basePath}/exchange-activity-feed`),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'GET',
  url: `${baseUrl}/exchanges/{exchangeId}/comments`,
  handler: require(`${basePath}/view-exchange-comments`),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'POST',
  url: `${baseUrl}/exchanges`,
  handler: require(`${basePath}/create-exchange`),
  validator: require('./validators/create-exchange'),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'POST',
  url: `${baseUrl}/exchanges/{exchangeId}/comments`,
  handler: require(`${basePath}/create-exchange-comment`),
  validator: require('./validators/create-comment'),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'PUT',
  url: `${baseUrl}/exchanges/{exchangeId}`,
  handler: require(`${basePath}/update-exchange`),
  validator: require('./validators/update-exchange'),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'PATCH',
  url: `${baseUrl}/exchanges/{exchangeId}`,
  handler: require(`${basePath}/modify-exchange`),
  validator: require('./validators/modify-exchange'),
  permissions: ERoutePermissions.NETWORK_USER,
}, {
  method: 'GET',
  url: '/v2/exchanges/reminder',
  handler: require(`${basePath}/send-reminder`),
  prefetch: false,
}, {
  method: 'DELETE',
  url: `${baseUrl}/exchanges/{exchangeId}`,
  handler: require(`${basePath}/remove-exchange`),
  permissions: ERoutePermissions.NETWORK_USER,
}];

module.exports = createRoutes(routes);
