import { assert } from 'chai';
import moment from 'moment';
import * as testHelper from '../../../shared/test-utils/helpers';
import { patchRequest } from '../../../shared/test-utils/request';
import * as objectRepository from '../../core/repositories/object';
import { exchangeTypes } from '../repositories/dao/exchange';
import * as exchangeService from '../services/flexchange';

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

    acceptedExchange = await exchangeService.createExchange({
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test exchange to approve',
      values: [network.id],
    }, {
      network,
      credentials: admin,
    });

    rejectedExchange = await exchangeService.createExchange({
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test exchange to reject',
      values: [network.id],
    }, {
      network,
      credentials: admin,
    });

    await exchangeService.acceptExchange({
      exchangeId: acceptedExchange.id,
    }, { network, credentials: admin });

    await exchangeService.acceptExchange({
      exchangeId: rejectedExchange.id,
    }, { network, credentials: admin })
    .then(() => exchangeService.rejectExchange({
      exchangeId: rejectedExchange.id,
      userId: admin.id,
    }, { network, credentials: admin }));
  });

  after(() => testHelper.cleanAll());

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${acceptedExchange.id}`;
    const payload = { action: 'approve', user_id: admin.id };
    const { result, statusCode } = await patchRequest(endpoint, payload, admin.token);

    assert.equal(result.data.response_status, 'APPROVED');
    assert.equal(result.data.accept_count, 1);
    assert.equal(result.data.approved_user.id, admin.id);
    assert.isDefined(result.data.responses[0].id);
    assert.equal(statusCode, 200);
  });

  it('should delete objects associated to the exchange', async () => {
    const createdObjects = await objectRepository.findBy({
      objectType: 'exchange',
      sourceId: acceptedExchange.id,
    });

    assert.lengthOf(createdObjects, 0);
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
