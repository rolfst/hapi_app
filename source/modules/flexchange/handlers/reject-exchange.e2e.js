import { assert } from 'chai';
import moment from 'moment';
import * as testHelper from '../../../shared/test-utils/helpers';
import { patchRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../repositories/dao/exchange';
import {
  createExchange,
  acceptExchange,
  declineExchange,
  approveExchange,
} from '../repositories/exchange';

describe('Reject exchange', () => {
  let admin;
  let employee;
  let network;
  let exchange;
  let approvedExchange;

  before(async () => {
    [admin, employee] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
    ]);
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
    await testHelper.addUserToNetwork({
      userId: employee.id,
      networkId: network.id,
    });

    const exchangeAPromise = createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to accept & reject',
    });

    const exchangeBPromise = createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to approve',
    });

    const [exchangeA, exchangeB] = await Promise.all([exchangeAPromise, exchangeBPromise]);
    const acceptAPromise = acceptExchange(exchangeA.id, admin.id);
    const declineAPromise = declineExchange(exchangeA.id, employee.id);
    const acceptBPromise = acceptExchange(exchangeB.id, admin.id);

    await Promise.all([acceptAPromise, declineAPromise, acceptBPromise]);

    exchange = exchangeA;
    approvedExchange = await approveExchange(exchangeB, admin, admin.id);
  });

  after(() => testHelper.cleanAll());

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const payload = { action: 'reject', user_id: admin.id };
    const { result, statusCode } = await patchRequest(endpoint, payload, admin.token);

    assert.equal(result.data.response_status, 'REJECTED');
    assert.equal(result.data.title, 'Test shift to accept & reject');
    assert.equal(statusCode, 200);
  });

  it('should fail when trying to reject a declined response', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const payload = { action: 'reject', user_id: employee.id };
    const { statusCode } = await patchRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when trying to reject a response from an already approved exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${approvedExchange.id}`;
    const payload = { action: 'reject', user_id: admin.id };
    const { statusCode } = await patchRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when user doesn\'t have permission to reject', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const payload = { action: 'reject', user_id: admin.id };
    const { statusCode } = await patchRequest(
      endpoint, payload, employee.token);

    assert.equal(statusCode, 403);
  });
});
