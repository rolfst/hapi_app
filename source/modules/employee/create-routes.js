/* eslint-disable max-len */

import router from 'common/utils/router';
const basePath = 'modules/employee/handlers';
const baseUrl = '/v2/networks/{networkId}';

export default [
  router.get(`${baseUrl}/users/me`, require(`${basePath}/view-my-profile`)),
  router.put(`${baseUrl}/users/me`, require(`${basePath}/update-my-profile`)),
];
