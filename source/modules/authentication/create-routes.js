import createRoutes from 'shared/utils/create-routes';

const routes = [{
  method: 'POST',
  url: '/v2/authenticate',
  handler: require('modules/authentication/handlers/authenticate'),
  validator: require('modules/authentication/validators/authenticate'),
  auth: false,
}, {
  method: 'GET',
  url: '/v2/delegate',
  handler: require('modules/authentication/handlers/delegate'),
  validator: require('modules/authentication/validators/delegate'),
  auth: false,
}];

export default createRoutes(routes);
