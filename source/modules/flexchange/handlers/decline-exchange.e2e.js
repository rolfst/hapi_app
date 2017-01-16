import { assert } from 'chai';
import moment from 'moment';
import { patchRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../repositories/dao/exchange';
import { createExchange } from '../repositories/exchange';

describe('Decline exchange', () => {
  let exchange;

  before(async () => {
    exchange = await createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to decline',
    });
  });

  after(() => exchange.destroy());

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges/${exchange.id}`;

    const { statusCode, result: { data } } = await patchRequest(endpoint, { action: 'decline' });

    assert.equal(statusCode, 200);
    assert.equal(data.response_status, 'DECLINED');
    assert.equal(data.accept_count, 0);
    assert.equal(data.decline_count, 1);
    assert.equal(data.responses[0].response, false);
    assert.equal(data.responses[0].user.full_name, global.users.admin.fullName);
  });

  it('should be able to decline after accepting', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges/${exchange.id}`;

    await patchRequest(endpoint, { action: 'accept' });
    const { statusCode, result: { data } } = await patchRequest(endpoint, { action: 'decline' });

    assert.equal(statusCode, 200);
    assert.equal(data.response_status, 'DECLINED');
    assert.equal(data.accept_count, 0);
    assert.equal(data.decline_count, 1);
  });
});
