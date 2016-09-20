import createRoutes from 'shared/utils/create-routes';

const basePath = 'modules/flexchange/handlers';
const baseUrl = '/v2/networks/{networkId}';

const routes = [{
  method: 'GET',
  url: `${baseUrl}/users/me/shifts`,
  handler: require(`${basePath}/my-shifts`),
}, {
  method: 'GET',
  url: `${baseUrl}/shifts/{shiftId}/available`,
  handler: require(`${basePath}/available-users-for-shift`),
}, {
  method: 'GET',
  url: `${baseUrl}/shifts/{shiftId}`,
  handler: require(`${basePath}/view-shift`),
}, {
  method: 'GET',
  url: `${baseUrl}/users/me/exchanges`,
  handler: require(`${basePath}/my-exchanges`),
  validator: require('modules/flexchange/validators/get-exchange'),
}, {
  method: 'GET',
  url: `${baseUrl}/users/me/exchanges/responded_to`,
  handler: require(`${basePath}/responded-to`),
}, {
  method: 'GET',
  url: `${baseUrl}/users/me/exchanges/accepted`,
  handler: require(`${basePath}/my-accepted-exchanges`),
}, {
  method: 'GET',
  url: `${baseUrl}/exchanges`,
  handler: require(`${basePath}/all-exchanges-for-network`),
  validator: require('modules/flexchange/validators/get-exchange'),
}, {
  method: 'GET',
  url: `${baseUrl}/teams/{teamId}/exchanges`,
  handler: require(`${basePath}/all-exchanges-for-team`),
  validator: require('modules/flexchange/validators/get-exchange'),
}, {
  method: 'GET',
  url: `${baseUrl}/exchanges/{exchangeId}`,
  handler: require(`${basePath}/view-exchange`),
  validator: require('modules/flexchange/validators/get-exchange'),
}, {
  method: 'GET',
  url: `${baseUrl}/exchanges/{exchangeId}/activity_feed`,
  handler: require(`${basePath}/exchange-activity-feed`),
}, {
  method: 'GET',
  url: `${baseUrl}/exchanges/{exchangeId}/comments`,
  handler: require(`${basePath}/view-exchange-comments`),
}, {
  method: 'POST',
  url: `${baseUrl}/exchanges`,
  handler: require(`${basePath}/create-exchange`),
  validator: require('modules/flexchange/validators/create-exchange'),
}, {
  method: 'POST',
  url: `${baseUrl}/exchanges/{exchangeId}/comments`,
  handler: require(`${basePath}/create-exchange-comment`),
  validator: require('modules/flexchange/validators/create-comment'),
}, {
  method: 'PUT',
  url: `${baseUrl}/exchanges/{exchangeId}`,
  handler: require(`${basePath}/update-exchange`),
  validator: require('modules/flexchange/validators/update-exchange'),
}, {
  method: 'PATCH',
  url: `${baseUrl}/exchanges/{exchangeId}`,
  handler: require(`${basePath}/modify-exchange`),
  validator: require('modules/flexchange/validators/modify-exchange'),
}, {
  method: 'DELETE',
  url: `${baseUrl}/exchanges/{exchangeId}`,
  handler: require(`${basePath}/remove-exchange`),
}];

export default createRoutes(routes);
