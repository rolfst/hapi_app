import { assert } from 'chai';
import moment from 'moment';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { patchRequest } from 'common/test-utils/request';
import {
  createExchange,
  acceptExchange,
  declineExchange,
  approveExchange,
} from 'modules/flexchange/repositories/exchange';

describe('Reject exchange', () => {
  let network;
  let exchange;
  let approvedExchange;
  let createdExchanges;

  before(async () => {
    network = global.networks.flexAppeal;

    const exchangeAPromise = createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to accept & reject',
    });

    const exchangeBPromise = createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to approve',
    });

    const [exchangeA, exchangeB] = await Promise.all([exchangeAPromise, exchangeBPromise]);
    const acceptAPromise = acceptExchange(exchangeA.id, global.users.admin.id);
    const declineAPromise = declineExchange(exchangeA.id, global.users.employee.id);
    const acceptBPromise = acceptExchange(exchangeB.id, global.users.admin.id);

    createdExchanges = await Promise.all([acceptAPromise, declineAPromise, acceptBPromise]);

    exchange = exchangeA;
    approvedExchange = await approveExchange(exchangeB, global.users.admin, global.users.admin.id);
  });

  after(() => Promise.all(createdExchanges.map(e => e.destroy())));

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const payload = { action: 'reject', user_id: global.users.admin.id };
    const { result, statusCode } = await patchRequest(endpoint, payload);

    assert.equal(result.data.response_status, 'REJECTED');
    assert.equal(result.data.title, 'Test shift to accept & reject');
    assert.equal(statusCode, 200);
  });

  it('should fail when trying to reject a declined response', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const payload = { action: 'reject', user_id: global.users.employee.id };
    const { statusCode } = await patchRequest(endpoint, payload);

    assert.equal(statusCode, 422);
  });

  it('should fail when trying to reject a response from an already approved exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${approvedExchange.id}`;
    const payload = { action: 'reject', user_id: global.users.admin.id };
    const { statusCode } = await patchRequest(endpoint, payload);

    assert.equal(statusCode, 422);
  });

  it('should fail when user doesn\'t have permission to reject', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const payload = { action: 'reject', user_id: global.users.admin.id };
    const promise = patchRequest(endpoint, payload, global.server, global.tokens.employee);
    const { statusCode } = await promise;

    assert.equal(statusCode, 403);
  });
});
