import { assert } from 'chai';
import sinon from 'sinon';
import moment from 'moment';
import notifier from '../../../shared/services/notifier';
import { patchRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../models/exchange';
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

    assert.equal(response.statusCode, 200);
    assert.equal(data.response_status, 'ACCEPTED');
    assert.equal(data.accept_count, 1);
    assert.equal(data.responses[0].response, true);
    assert.equal(data.responses[0].user.full_name, global.users.admin.fullName);
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

  it('should send accept notification to admin', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;

    await patchRequest(endpoint, { action: 'accept' });

    assert.equal(notifier.send.called, true);

    notifier.send.restore();
    sinon.stub(notifier, 'send').returns(null);
  });
});
