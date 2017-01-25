import { assert } from 'chai';
import sinon from 'sinon';
import moment from 'moment';
import * as testHelper from '../../../shared/test-utils/helpers';
import * as notifier from '../../../shared/services/notifier';
import blueprints from '../../../shared/test-utils/blueprints';
import { patchRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../repositories/dao/exchange';
import { createExchange } from '../repositories/exchange';

describe('Accept exchange', () => {
  let sandbox;
  let network;
  let admin;
  let exchange;
  let accessToken;

  before(async () => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(notifier, 'send').returns(null);

    admin = await testHelper.createUser();
    network = await testHelper.createNetwork({ userId: admin.id });

    await testHelper.addUserToNetwork(
        { networkId: network.id, userId: admin.id, roleType: 'ADMIN' });

    const { tokens } = await testHelper.getLoginToken(blueprints.users.admin);
    accessToken = tokens.access_token;

    exchange = await createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to accept',
    });
  });

  after(async () => {
    sandbox.restore();

    return testHelper.cleanAll();
  });

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;

    const response = await patchRequest(endpoint, { action: 'accept' }, accessToken);
    const { data } = response.result;

    assert.equal(response.statusCode, 200);
    assert.equal(data.response_status, 'ACCEPTED');
    assert.equal(data.accept_count, 1);
    assert.equal(data.responses[0].response, true);
    assert.equal(data.responses[0].user.full_name, admin.fullName);
  });

  it('should be able to accept after declining', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;

    await patchRequest(endpoint, { action: 'decline' });
    const { statusCode, result: { data } } = await patchRequest(
        endpoint, { action: 'accept' }, accessToken);

    assert.equal(statusCode, 200);
    assert.equal(data.response_status, 'ACCEPTED');
    assert.equal(data.accept_count, 1);
    assert.equal(data.responses[0].response, true);
    assert.equal(data.responses[0].user.full_name, admin.fullName);
  });

  it('should send accept notification to admin', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;

    await patchRequest(endpoint, { action: 'accept' }, accessToken);

    assert.equal(notifier.send.called, true);
  });
});
