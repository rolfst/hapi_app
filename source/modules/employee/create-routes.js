import createRoutes from 'common/utils/create-routes';

const baseImport = 'modules/employee/handlers';
const basePath = '/v2/networks/{networkId}';

const routes = [{
  method: 'GET',
  url: `${basePath}/users/me`,
  handler: require(`${baseImport}/view-my-profile`),
}, {
  method: 'PUT',
  url: `${basePath}/users/me`,
  handler: require(`${baseImport}/update-my-profile`),
  validator: require('modules/employee/validators/update-user'),
}, {
  method: 'POST',
  url: `${basePath}/users`,
  handler: require(`${baseImport}/invite-user`),
  validator: require('modules/employee/validators/create-user'),
}];

export default createRoutes(routes);
