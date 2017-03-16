const { assert } = require('chai');
const moment = require('moment');
const testHelper = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');
const { exchangeTypes } = require('../repositories/dao/exchange');
const { createExchange } = require('../repositories/exchange');
const { createExchangeComment } = require('../repositories/comment');

describe('View exchange comment', () => {
  let network;
  let admin;
  let exchange;

  before(async () => {
    admin = await testHelper.createUser();
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
    const userId = admin.id;

    exchange = await createExchange(userId, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift 1 for network',
    });

    return Promise.all([
      createExchangeComment(exchange.id, { userId, text: 'Comment #1' }),
      createExchangeComment(exchange.id, { userId, text: 'Comment #2' }),
      createExchangeComment(exchange.id, { userId, text: 'Comment #3' }),
    ]);
  });

  after(() => testHelper.cleanAll());

  it('should return comments for exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/comments`;
    const { result, statusCode } = await getRequest(endpoint, admin.token);

    assert.lengthOf(result.data, 3);
    assert.equal(statusCode, 200);
  });
});
