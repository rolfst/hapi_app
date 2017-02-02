import { assert } from 'chai';
import moment from 'moment';
import * as testHelper from '../../../shared/test-utils/helpers';
import { patchRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../repositories/dao/exchange';
import { createExchange } from '../repositories/exchange';

describe('Decline exchange', () => {
  let exchange;
  let admin;
  let network;

  before(async () => {
    admin = await testHelper.createUser();
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    exchange = await createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to decline',
    });
  });

  after(() => testHelper.cleanAll());

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;

    const { statusCode, result: { data } } = await patchRequest(
        endpoint, { action: 'decline' }, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(data.response_status, 'DECLINED');
    assert.equal(data.accept_count, 0);
    assert.equal(data.decline_count, 1);
    assert.equal(data.responses[0].response, false);
    assert.equal(data.responses[0].user.full_name, admin.fullName);
  });

  it('should be able to decline after accepting', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;

    await patchRequest(endpoint, { action: 'accept' }, admin.token);
    const { statusCode, result: { data } } = await patchRequest(
        endpoint, { action: 'decline' }, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(data.response_status, 'DECLINED');
    assert.equal(data.accept_count, 0);
    assert.equal(data.decline_count, 1);
  });
});
