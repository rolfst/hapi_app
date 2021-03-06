/* eslint-disable global-require */
const { createRoutes } = require('../../shared/utils/create-routes');

const routes = [{
  method: 'POST',
  url: '/v2/authenticate',
  handler: require('./handlers/authenticate'),
  validator: require('./validators/authenticate'),
  auth: false,
}, {
  method: 'GET',
  url: '/v2/delegate',
  handler: require('./handlers/delegate'),
  validator: require('./validators/delegate'),
  auth: false,
}];

module.exports = createRoutes(routes);
