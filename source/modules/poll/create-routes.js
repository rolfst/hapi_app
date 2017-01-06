import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'POST',
  url: '/v2/polls/{pollId}/vote',
  handler: require('./handlers/vote'),
}];

export default createRoutes(routes);
