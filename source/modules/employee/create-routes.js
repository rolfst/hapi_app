import createRoutes from '../../shared/utils/create-routes';

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
  method: 'GET',
  url: `${basePath}/users/bulk_invite`,
  handler: require(`${baseImport}/bulk-invite-users`),
}];

export default createRoutes(routes);
