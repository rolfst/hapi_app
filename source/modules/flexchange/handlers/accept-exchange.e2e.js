import { assert } from 'chai';
import moment from 'moment';
import { exchangeTypes } from '../models/exchange';
import { patchRequest } from '../../../shared/test-utils/request';
import { createExchange } from '../repositories/exchange';

describe('Accept exchange', () => {
  let network;
  let exchange;

  before(async () => {
    network = global.networks.flexAppeal;

    exchange = await createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to accept',
    });
  });

  after(() => exchange.destroy());

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;

    const response = await patchRequest(endpoint, { action: 'accept' });
    const { data } = response.result;

    assert.equal(data.response_status, 'ACCEPTED');
    assert.equal(data.accept_count, 1);
    assert.equal(data.responses[0].response, true);
    assert.equal(data.responses[0].user.full_name, global.users.admin.fullName);
    assert.equal(response.statusCode, 200);
  });

  it('should be able to accept after declining', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;

    await patchRequest(endpoint, { action: 'decline' });
    const { statusCode, result: { data } } = await patchRequest(endpoint, { action: 'accept' });

    assert.equal(statusCode, 200);
    assert.equal(data.response_status, 'ACCEPTED');
    assert.equal(data.accept_count, 1);
    assert.equal(data.responses[0].response, true);
    assert.equal(data.responses[0].user.full_name, global.users.admin.fullName);
  });
});
