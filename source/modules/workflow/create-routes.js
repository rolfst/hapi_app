/* eslint-disable global-require, import/no-dynamic-require */
const { createRoutes } = require('../../shared/utils/create-routes');

const basePath = './handlers';
const baseUrl = '/v2/organisations/{organisationId}';

const routes = [{
  method: 'POST',
  url: `${baseUrl}/workflows`,
  handler: require(`${basePath}/create-workflow`),
  validator: require(`${basePath}/create-workflow`),
}];

module.exports = createRoutes(routes);
