/* eslint-disable max-len */

import router from 'common/utils/router';
const basePath = 'modules/flexchange/handlers';
const baseUrl = '/v2/networks/{networkId}';

export default [
  router.get(`${baseUrl}/users/me/shifts`, require(`${basePath}/my-shifts`)),
  router.get(`${baseUrl}/users/me/exchanges`, require(`${basePath}/my-exchanges`)), //
  // router.get(`${baseUrl}/users/me/exchanges/responded_to`, require(`${basePath}/exchanges-responded-to`)),
  router.get(`${baseUrl}/exchanges`, require(`${basePath}/all-exchanges-for-network`)), //
  router.get(`${baseUrl}/shifts/{shiftId}/available`, require(`${basePath}/shifts-available`)),
  router.get(`${baseUrl}/teams/{teamId}/exchanges`, require(`${basePath}/all-exchanges-for-team`)),
  router.get(`${baseUrl}/exchanges/{exchangeId}`, require(`${basePath}/view-exchange`)),
  router.get(`${baseUrl}/exchanges/{exchangeId}/comments`, require(`${basePath}/view-exchange-comments`)),
  router.post(`${baseUrl}/exchanges`, require(`${basePath}/create-exchange`)),
  router.post(`${baseUrl}/exchanges/{exchangeId}/comments`, require(`${basePath}/create-exchange-comment`)),
  router.put(`${baseUrl}/exchanges/{exchangeId}`, require(`${basePath}/update-exchange`)),
  router.patch(`${baseUrl}/exchanges/{exchangeId}`, require(`${basePath}/modify-exchange`)),
  router.delete(`${baseUrl}/exchanges/{exchangeId}`, require(`${basePath}/remove-exchange`)),
];
