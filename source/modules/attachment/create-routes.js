import createRoutes from '../../shared/utils/create-routes';

const routes = [{
  method: 'POST',
  url: '/v2/networks/{networkId}/files',
  handler: require('./handlers/upload-file'),
  validator: require('./validators/upload-file'),
  payload: {
    maxBytes: 4000000,
    output: 'stream',
    parse: true,
  },
}];

export default createRoutes(routes);
