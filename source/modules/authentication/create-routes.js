/* eslint-disable max-len */

import router from 'common/utils/router';
const basePath = 'modules/authentication/handlers';

export default [
  router.post('/v2/authorize', require(`${basePath}/authorize`), null),
  // router.get('/v2/delegate', require(`${basePath}/delegate`)),
];
