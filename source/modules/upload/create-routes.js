import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'POST',
  url: '/v2/uploads',
  payload: {
    output: 'stream',
    parse: true,
  },
  handler: require('./handlers/upload'),
  //validator: require('./validators/upload'),
}];

export default createRoutes(routes);
