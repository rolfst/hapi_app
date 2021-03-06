/* eslint-disable global-require, import/no-dynamic-require */
const { createRoutes } = require('../../shared/utils/create-routes');
const { ERoutePermissions } = require('../authorization/definitions');

const handlerPath = './handlers';
const validatorPath = './validators';
const baseUrl = '/v2/organisations/{organisationId}';

const routes = [{
  method: 'POST',
  url: `${baseUrl}/workflows`,
  handler: require(`${handlerPath}/create-complete-workflow`),
  validator: require(`${validatorPath}/create-complete-workflow`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}, {
  method: 'PUT',
  url: `${baseUrl}/workflows/{workflowId}`,
  handler: require(`${handlerPath}/update-workflow`),
  validator: require(`${validatorPath}/update-workflow`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}, {
  method: 'DELETE',
  url: `${baseUrl}/workflows/{workflowId}`,
  handler: require(`${handlerPath}/remove-workflow`),
  validator: require(`${validatorPath}/remove-workflow`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}, {
  method: 'GET',
  url: `${baseUrl}/workflows`,
  handler: require(`${handlerPath}/list-workflows`),
  validator: require(`${validatorPath}/list-workflows`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}, {
  method: 'GET',
  url: `${baseUrl}/workflows/{workflowId}`,
  handler: require(`${handlerPath}/fetch-workflow`),
  validator: require(`${validatorPath}/fetch-workflow`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}, {
  method: 'POST',
  url: `${baseUrl}/workflows/preview`,
  handler: require(`${handlerPath}/preview-conditions`),
  validator: require(`${validatorPath}/preview-conditions`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}];

const subBaseUrl = `${baseUrl}/workflows/{workflowId}`;

const triggerRoutes = [{
  method: 'POST',
  url: `${subBaseUrl}/triggers`,
  handler: require(`${handlerPath}/create-trigger`),
  validator: require(`${validatorPath}/create-trigger`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}, {
  method: 'PUT',
  url: `${subBaseUrl}/triggers/{triggerId}`,
  handler: require(`${handlerPath}/update-trigger`),
  validator: require(`${validatorPath}/update-trigger`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}, {
  method: 'DELETE',
  url: `${subBaseUrl}/triggers/{triggerId}`,
  handler: require(`${handlerPath}/remove-trigger`),
  validator: require(`${validatorPath}/remove-trigger`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}];

const conditionRoutes = [{
  method: 'POST',
  url: `${subBaseUrl}/conditions`,
  handler: require(`${handlerPath}/create-condition`),
  validator: require(`${validatorPath}/create-condition`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}, {
  method: 'PUT',
  url: `${subBaseUrl}/conditions/{conditionId}`,
  handler: require(`${handlerPath}/update-condition`),
  validator: require(`${validatorPath}/update-condition`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}, {
  method: 'DELETE',
  url: `${subBaseUrl}/conditions/{conditionId}`,
  handler: require(`${handlerPath}/remove-condition`),
  validator: require(`${validatorPath}/remove-condition`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}];

const actionRoutes = [{
  method: 'POST',
  url: `${subBaseUrl}/actions`,
  handler: require(`${handlerPath}/create-action`),
  validator: require(`${validatorPath}/create-action`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}, {
  method: 'PUT',
  url: `${subBaseUrl}/actions/{actionId}`,
  handler: require(`${handlerPath}/update-action`),
  validator: require(`${validatorPath}/update-action`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}, {
  method: 'DELETE',
  url: `${subBaseUrl}/actions/{actionId}`,
  handler: require(`${handlerPath}/remove-action`),
  validator: require(`${validatorPath}/remove-action`),
  permissions: ERoutePermissions.ORGANISATION_ADMIN,
  prefetch: false,
}];

module.exports = createRoutes([...routes, ...triggerRoutes, ...conditionRoutes, ...actionRoutes]);
