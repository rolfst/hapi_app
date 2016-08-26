import { assert } from 'chai';
import moment from 'moment';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { patchRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let exchange;

describe('Decline exchange', () => {
  before(async () => {
    exchange = await createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to decline',
    });
  });

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
