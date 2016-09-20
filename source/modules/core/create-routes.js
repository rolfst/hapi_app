import createRoutes from 'shared/utils/create-routes';

const routes = [{
  method: 'GET',
  url: '/v2/users/me/networks',
  handler: require('modules/core/handlers/networks-for-user'),
  prefetch: false,
}];

export default createRoutes(routes);
