import router from 'common/utils/router';
const basePath = 'modules/flexchange/handlers/';

export default [
  router.get('/v2/networks/{networkId}/users/me/shifts', require(basePath + 'my-shifts')),
  router.get('/v2/networks/{networkId}/users/me/exchanges', require(basePath + 'my-exchanges')), //
  // router.get('/v2/networks/{networkId}/users/me/exchanges/responded_to', require(basePath + 'exchanges-responded-to')),
  router.get('/v2/networks/{networkId}/exchanges', require(basePath + 'all-exchanges-for-network')), //
  router.get('/v2/networks/{networkId}/shifts/{shiftId}/available', require(basePath + 'shifts-available')),
  router.get('/v2/networks/{networkId}/teams/{teamId}/exchanges', require(basePath + 'all-exchanges-for-team')),
  router.get('/v2/networks/{networkId}/exchanges/{exchangeId}', require(basePath + 'view-exchange')),
  router.get('/v2/networks/{networkId}/exchanges/{exchangeId}/comments', require(basePath + 'view-exchange-comments')),
  router.post('/v2/networks/{networkId}/exchanges', require(basePath + 'create-exchange')),
  router.post('/v2/networks/{networkId}/exchanges/{exchangeId}/comments', require(basePath + 'create-exchange-comment')),
  router.put('/v2/networks/{networkId}/exchanges/{exchangeId}', require(basePath + 'update-exchange')),
  router.patch('/v2/networks/{networkId}/exchanges/{exchangeId}', require(basePath + 'modify-exchange')),
  router.delete('/v2/networks/{networkId}/exchanges/{exchangeId}', require(basePath + 'remove-exchange')),
];
