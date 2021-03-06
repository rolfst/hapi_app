const { assert } = require('chai');
const moment = require('moment');
const testHelper = require('../../../shared/test-utils/helpers');
const { patchRequest } = require('../../../shared/test-utils/request');
const { exchangeTypes } = require('../repositories/dao/exchange');
const { createExchange } = require('../repositories/exchange');

describe('Modify exchange', () => {
  let admin;
  let exchange;
  let expiredExchange;
  let network;

  before(async () => {
    admin = await testHelper.createUser();
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    exchange = await createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to check for modification',
    });

    expiredExchange = await createExchange(admin.id, network.id, {
      date: moment().subtract(1, 'week').format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Expired shift to check for modification',
    });
  });

  after(() => testHelper.cleanAll());

  it('should fail when action does not exist', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const { statusCode } = await patchRequest(endpoint, { action: 'wrong_action' }, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should fail when exchange is expired', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${expiredExchange.id}`;
    const { statusCode } = await patchRequest(endpoint, { action: 'accept' }, admin.token);

    assert.equal(statusCode, 403);
  });
});
