import { assert } from 'chai';
import moment from 'moment';
import * as testHelper from '../../../shared/test-utils/helpers';
import { patchRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../repositories/dao/exchange';
import * as exchangeRepo from '../repositories/exchange';

describe('Approve exchange', () => {
  let admin;
  let employee;
  let network;
  let acceptedExchange;
  let rejectedExchange;

  before(async () => {
    [admin, employee] = await Promise.all([
      testHelper.createUser({ username: 'admin@flex-appeal.nl', password: 'foo' }),
      testHelper.createUser({ username: 'employee@flex-appeal.nl', password: 'baz' }),
    ]);
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
    await testHelper.addUserToNetwork({ networkId: network.id, userId: employee.id });

    const exchangeToAccept = await exchangeRepo.createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test exchange to approve',
    });

    const exchangeToReject = await exchangeRepo.createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test exchange to reject',
    });

    const acceptedExchangePromise = exchangeRepo.acceptExchange(exchangeToAccept.id,
      admin.id)
    .then(() => exchangeToAccept.reload());

    const rejectedExchangePromise = exchangeRepo.acceptExchange(exchangeToReject.id,
      admin.id)
    .then(() => exchangeRepo.rejectExchange(exchangeToReject, admin, admin.id));

    [acceptedExchange, rejectedExchange] = await Promise.all([
      acceptedExchangePromise, rejectedExchangePromise,
    ]);
  });

  after(() => testHelper.cleanAll());

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${acceptedExchange.id}`;
    const payload = { action: 'approve', user_id: admin.id };
    const { result, statusCode } = await patchRequest(endpoint, payload, admin.token);

    assert.equal(result.data.response_status, 'APPROVED');
    assert.equal(result.data.accept_count, 1);
    assert.equal(result.data.approved_user.id, admin.id);
    assert.equal(statusCode, 200);
  });

  it('should fail when user wants to approve a rejected exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${rejectedExchange.id}`;
    const payload = { action: 'approve', user_id: admin.id };
    const { statusCode } = await patchRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when there is no user_id is present', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${acceptedExchange.id}`;
    const payload = { action: 'approve' };
    const { statusCode } = await patchRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should fail if user has not accepted the exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${acceptedExchange.id}`;
    const payload = { action: 'approve', user_id: employee.id };
    const { statusCode } = await patchRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when user doesn\'t have permission to approve', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${acceptedExchange.id}`;
    const payload = { action: 'approve', user_id: employee.id };
    const { statusCode } = await patchRequest(endpoint, payload, employee.token);

    assert.equal(statusCode, 403);
  });
});
