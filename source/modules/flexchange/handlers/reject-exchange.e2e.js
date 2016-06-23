import { assert } from 'chai';
import moment from 'moment';
import authenticate from 'common/test-utils/authenticate';
import { patchRequest } from 'common/test-utils/request';
import {
  createExchange,
  acceptExchange,
  declineExchange,
  approveExchange,
} from 'modules/flexchange/repositories/exchange';

let exchange = null;
let approvedExchange = null;

describe('Reject exchange', () => {
  before(async () => {
    const exchangeAPromise = createExchange(global.authUser.id, global.network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift to accept & reject',
    });
    const exchangeBPromise = createExchange(global.authUser.id, global.network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift to approve',
    });

    const [exchangeA, exchangeB] = await Promise.all([exchangeAPromise, exchangeBPromise]);
    const acceptAPromise = acceptExchange(exchangeA.id, 1);
    const declineAPromise = declineExchange(exchangeA.id, 3);
    const acceptBPromise = acceptExchange(exchangeB.id, 1);

    await Promise.all([acceptAPromise, declineAPromise, acceptBPromise]);

    exchange = exchangeA;
    approvedExchange = await approveExchange(exchangeB, global.authUser, 1);
  });

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${global.network.id}/exchanges/${exchange.id}`;

    const { result, statusCode } = await patchRequest(endpoint, { action: 'reject', user_id: 1 });

    assert.equal(result.data.response_status, 'REJECTED');
    assert.equal(result.data.title, 'Test shift to accept & reject');
    assert.equal(statusCode, 200);
  });

  it('should fail when trying to reject a declined response', async () => {
    const endpoint = `/v2/networks/${global.network.id}/exchanges/${exchange.id}`;

    const { statusCode } = await patchRequest(endpoint, { action: 'reject', user_id: 3 });

    assert.equal(statusCode, 422);
  });

  it('should fail when trying to reject a response from an already approved exchange', async () => {
    const endpoint = `/v2/networks/${global.network.id}/exchanges/${approvedExchange.id}`;

    const { statusCode } = await patchRequest(endpoint, { action: 'reject', user_id: 1 });

    assert.equal(statusCode, 422);
  });

  it('should fail when user doesn\'t have permission to accept', async () => {
    const endpoint = `/v2/networks/1/exchanges/${exchange.id}`;
    const payload = { action: 'reject' };

    const credentials = { username: 'liam@flex-appeal.nl', password: 'admin' };
    const { authToken } = await authenticate(global.server, credentials);
    const { statusCode } = await patchRequest(endpoint, payload, global.server, authToken);

    assert.equal(statusCode, 403);
  });
});
