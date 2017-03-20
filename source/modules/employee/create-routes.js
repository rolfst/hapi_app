const { createRoutes } = require('../../shared/utils/create-routes');

const baseImport = './handlers';
const basePath = '/v2/networks/{networkId}';

const routes = [{
  method: 'GET',
  url: `${basePath}/users/me`,
  handler: require(`${baseImport}/view-my-profile`),
}, {
  method: 'PUT',
  url: `${basePath}/users/me`,
  handler: require(`${baseImport}/update-my-profile`),
  validator: require('./validators/update-user'),
}, {
  method: 'POST',
  url: `${basePath}/users`,
  handler: require(`${baseImport}/invite-user`),
  validator: require('./validators/create-user'),
}, {
  method: 'POST',
  url: `${basePath}/users/invite`,
  handler: require(`${baseImport}/bulk-invite-users`),
  validator: require('./validators/bulk-invite'),
}];

module.exports = createRoutes(routes);
