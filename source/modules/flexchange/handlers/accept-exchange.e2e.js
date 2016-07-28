import { assert } from 'chai';
import moment from 'moment';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { patchRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

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
});
