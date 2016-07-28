import { assert } from 'chai';
import moment from 'moment';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import blueprints from 'common/test-utils/blueprints';
import authenticate from 'common/test-utils/authenticate';
import { patchRequest } from 'common/test-utils/request';
import {
  createExchange,
  acceptExchange,
  rejectExchange,
} from 'modules/flexchange/repositories/exchange';

describe('Approve exchange', () => {
  let creator;
  let network;
  let acceptedExchange;
  let rejectedExchange;

  before(async () => {
    creator = global.users.admin;
    network = global.networks.flexAppeal;

    const exchangeToAccept = await createExchange(creator.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test exchange to approve',
    });

    const exchangeToReject = await createExchange(creator.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test exchange to approve',
    });

    const acceptedExchangePromise = await acceptExchange(exchangeToAccept.id, creator.id)
      .then(() => exchangeToAccept.reload());

    const rejectedExchangePromise = await acceptExchange(exchangeToReject.id, creator.id)
      .then(() => rejectExchange(exchangeToReject, creator.id));

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

    assert.equal(statusCode, 422);
  });

  it('should fail when there is no user_id is present', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${acceptedExchange.id}`;
    const payload = { action: 'approve' };
    const { statusCode } = await patchRequest(endpoint, payload);

    assert.equal(statusCode, 422);
  });

  it('should fail if user has not accepted exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${acceptedExchange.id}`;
    const payload = { action: 'approve', user_id: global.users.employee.id };
    const { statusCode } = await patchRequest(endpoint, payload);

    assert.equal(statusCode, 422);
  });

  it('should fail when user doesn\'t have permission to approve', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${acceptedExchange.id}`;
    const payload = { action: 'approve' };
    const { username, password } = blueprints.users.employee;
    const { token } = await authenticate(global.server, { username, password });
    const { statusCode } = await patchRequest(endpoint, payload, global.server, token);

    assert.equal(statusCode, 403);
  });
});
