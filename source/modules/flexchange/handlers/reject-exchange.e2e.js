import { assert } from 'chai';
import moment from 'moment';
import blueprints from 'common/test-utils/blueprints';
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
    const exchangeAPromise = createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift to accept & reject',
    });

    const exchangeBPromise = createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift to approve',
    });

    const [exchangeA, exchangeB] = await Promise.all([exchangeAPromise, exchangeBPromise]);
    const acceptAPromise = acceptExchange(exchangeA.id, global.users.admin.id);
    const declineAPromise = declineExchange(exchangeA.id, global.users.employee.id);
    const acceptBPromise = acceptExchange(exchangeB.id, global.users.admin.id);

    await Promise.all([acceptAPromise, declineAPromise, acceptBPromise]);

    exchange = exchangeA;
    approvedExchange = await approveExchange(exchangeB, global.users.admin, global.users.admin.id);
  });

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges/${exchange.id}`;
    const { result, statusCode } = await patchRequest(endpoint, { action: 'reject', user_id: global.users.admin.id });

    assert.equal(result.data.response_status, 'REJECTED');
    assert.equal(result.data.title, 'Test shift to accept & reject');
    assert.equal(statusCode, 200);
  });

  it('should fail when trying to reject a declined response', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges/${exchange.id}`;
    const { statusCode } = await patchRequest(endpoint, { action: 'reject', user_id: global.users.employee.id });

    assert.equal(statusCode, 422);
  });

  it('should fail when trying to reject a response from an already approved exchange', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges/${approvedExchange.id}`;
    const { statusCode } = await patchRequest(endpoint, { action: 'reject', user_id: global.users.admin.id });

    assert.equal(statusCode, 422);
  });

  it('should fail when user doesn\'t have permission to reject', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges/${exchange.id}`;
    const payload = { action: 'reject', user_id: global.users.admin.id };
    const { username, password } = blueprints.users.employee;
    const { token } = await authenticate(global.server, { username, password });
    const { result, statusCode } = await patchRequest(endpoint, payload, global.server, token);

    assert.equal(statusCode, 403);
  });
});
