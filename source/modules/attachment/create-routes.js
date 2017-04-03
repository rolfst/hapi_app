/* eslint-disable global-require */
const { createRoutes } = require('../../shared/utils/create-routes');

const routes = [{
  method: 'POST',
  url: '/v2/networks/{networkId}/files',
  handler: require('./handlers/upload-file'),
  validator: require('./validators/upload-file'),
  payload: {
    maxBytes: 8388608,
    output: 'stream',
    parse: true,
  },
}];

module.exports = createRoutes(routes);
