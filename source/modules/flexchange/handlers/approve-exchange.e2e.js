import { assert } from 'chai';
import moment from 'moment';
import blueprints from '../../../shared/test-utils/blueprints';
import authenticate from '../../../shared/test-utils/authenticate';
import { patchRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../repositories/dao/exchange';
import * as exchangeRepo from '../repositories/exchange';

describe('Approve exchange', () => {
  let creator;
  let network;
  let acceptedExchange;
  let rejectedExchange;

  before(async () => {
    creator = global.users.admin;
    network = global.networks.flexAppeal;

    const exchangeToAccept = await exchangeRepo.createExchange(creator.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test exchange to approve',
    });

    const exchangeToReject = await exchangeRepo.createExchange(creator.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test exchange to reject',
    });

    const acceptedExchangePromise = exchangeRepo.acceptExchange(exchangeToAccept.id,
      creator.id)
    .then(() => exchangeToAccept.reload());

    const rejectedExchangePromise = exchangeRepo.acceptExchange(exchangeToReject.id,
      creator.id)
    .then(() => exchangeRepo.rejectExchange(exchangeToReject, creator, creator.id));

    [acceptedExchange, rejectedExchange] = await Promise.all([
      acceptedExchangePromise, rejectedExchangePromise,
    ]);
  });

  after(() => Promise.all([acceptedExchange.destroy(), rejectedExchange.destroy()]));

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${acceptedExchange.id}`;
    const payload = { action: 'approve', user_id: creator.id };
    const { result, statusCode } = await patchRequest(endpoint, payload);

    assert.equal(result.data.response_status, 'APPROVED');
    assert.equal(result.data.accept_count, 1);
    assert.equal(result.data.approved_user.id, creator.id);
    assert.equal(statusCode, 200);
  });

  it('should fail when user wants to approve a rejected exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${rejectedExchange.id}`;
    const payload = { action: 'approve', user_id: creator.id };
    const { statusCode } = await patchRequest(endpoint, payload);

    assert.equal(statusCode, 403);
  });

  it('should fail when there is no user_id is present', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${acceptedExchange.id}`;
    const payload = { action: 'approve' };
    const { statusCode } = await patchRequest(endpoint, payload);

    assert.equal(statusCode, 422);
  });

  it('should fail if user has not accepted the exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${acceptedExchange.id}`;
    const payload = { action: 'approve', user_id: global.users.employee.id };
    const { statusCode } = await patchRequest(endpoint, payload);

    assert.equal(statusCode, 403);
  });

  it('should fail when user doesn\'t have permission to approve', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${acceptedExchange.id}`;
    const payload = { action: 'approve', user_id: global.users.employee.id };
    const { username, password } = blueprints.users.employee;
    const { token } = await authenticate(global.server, { username, password });
    const { statusCode } = await patchRequest(endpoint, payload, global.server, token);

    assert.equal(statusCode, 403);
  });
});
