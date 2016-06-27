import { assert } from 'chai';
import moment from 'moment';
import authenticate from 'common/test-utils/authenticate';
import { patchRequest } from 'common/test-utils/request';
import { createExchange, acceptExchange } from 'modules/flexchange/repositories/exchange';

let exchange = null;

describe('Approve exchange', () => {
  before(async () => {
    exchange = await createExchange(global.authUser.id, global.network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift to approve',
    });

    return acceptExchange(exchange.id, 1);
  });

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${global.network.id}/exchanges/${exchange.id}`;

    const { result, statusCode } = await patchRequest(endpoint, { action: 'approve', user_id: 1 });

    assert.equal(result.data.response_status, 'APPROVED');
    assert.equal(result.data.accept_count, 1);
    assert.equal(result.data.approved_user.id, 1);
    assert.equal(statusCode, 200);
  });

  it('should fail when exchange is already approved', async () => {
    const endpoint = `/v2/networks/${global.network.id}/exchanges/${exchange.id}`;

    const { statusCode } = await patchRequest(endpoint, { action: 'approve', user_id: 1 });

    assert.equal(statusCode, 422);
  });

  it('should fail when no user_id is present', async () => {
    const endpoint = `/v2/networks/${global.network.id}/exchanges/${exchange.id}`;

    const { statusCode } = await patchRequest(endpoint, { action: 'approve' });

    assert.equal(statusCode, 422);
  });

  it('should fail if user has not accepted exchange', async () => {
    const endpoint = `/v2/networks/${global.network.id}/exchanges/${exchange.id}`;

    const { statusCode } = await patchRequest(endpoint, { action: 'approve', user_id: 3 });

    assert.equal(statusCode, 422);
  });

  it('should fail when user doesn\'t have permission to accept', async () => {
    // TODO: remove usage of hardcoded network id and user
    const endpoint = `/v2/networks/45/exchanges/${exchange.id}`;
    const payload = { action: 'approve' };

    const credentials = { username: 'liam@flex-appeal.nl', password: 'admin' };
    const { authToken } = await authenticate(global.server, credentials);
    const { statusCode } = await patchRequest(endpoint, payload, global.server, authToken);

    assert.equal(statusCode, 403);
  });
});
