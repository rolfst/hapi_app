/* eslint-disable global-require, import/no-dynamic-require */
const { createRoutes } = require('../../shared/utils/create-routes');

const handlerPath = './handlers';
const validatorPath = './validators';
const baseUrl = '/v2/organisations/{organisationId}';

const routes = [{
  method: 'POST',
  url: `${baseUrl}/workflows`,
  handler: require(`${handlerPath}/create-workflow`),
  validator: require(`${validatorPath}/create-workflow`),
  prefetch: false,
}, {
  method: 'PUT',
  url: `${baseUrl}/workflows/{workflowId}`,
  handler: require(`${handlerPath}/update-workflow`),
  validator: require(`${validatorPath}/update-workflow`),
  prefetch: false,
}, {
  method: 'GET',
  url: `${baseUrl}/workflows`,
  handler: require(`${handlerPath}/fetch-workflows`),
  validator: require(`${validatorPath}/fetch-workflows`),
  prefetch: false,
}, {
  method: 'GET',
  url: `${baseUrl}/workflows/{workflowId}`,
  handler: require(`${handlerPath}/fetch-workflow`),
  validator: require(`${validatorPath}/fetch-workflow`),
  prefetch: false,
}];

module.exports = createRoutes(routes);
