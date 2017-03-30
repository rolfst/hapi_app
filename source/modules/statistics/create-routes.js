/* eslint-disable global-require */
const { createRoutes } = require('../../shared/utils/create-routes');

const routes = [{
  method: 'GET',
  url: '/v2/networks/{networkId}/statistics',
  handler: require('./handlers/statistics'),
  validator: require('./validators/statistics'),
}];

module.exports = createRoutes(routes);
