const { assert } = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const testHelper = require('../../../shared/test-utils/helpers');
const notifier = require('../../../shared/services/notifier');
const { patchRequest } = require('../../../shared/test-utils/request');
const objectRepository = require('../../core/repositories/object');
const { exchangeTypes } = require('../repositories/dao/exchange');
const exchangeService = require('../services/flexchange');

describe('Accept exchange', () => {
  let sandbox;
  let network;
  let admin;
  let exchange;

  before(async () => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(notifier, 'send').returns(null);

    admin = await testHelper.createUser();
    network = await testHelper.createNetwork({ userId: admin.id });
    exchange = await exchangeService.createExchange({
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to accept',
    }, { network, credentials: admin });
  });

  after(async () => {
    sandbox.restore();

    return testHelper.cleanAll();
  });

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;

    const response = await patchRequest(endpoint, { action: 'accept' }, admin.token);
    const { data } = response.result;

    assert.equal(response.statusCode, 200);
    assert.equal(data.response_status, 'ACCEPTED');
    assert.equal(data.accept_count, 1);
    assert.isDefined(data.responses[0].id);
    assert.equal(data.responses[0].response, true);
    assert.equal(data.responses[0].user.full_name, admin.fullName);
  });

  it('should delete object for accepting user', async () => {
    const createdObjects = await objectRepository.findBy({
      objectType: 'exchange',
      sourceId: exchange.id,
      parentType: 'user',
      parentId: admin.id,
    });

    assert.lengthOf(createdObjects, 0);
  });

  it('should be able to accept after declining', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;

    await patchRequest(endpoint, { action: 'decline' });
    const { statusCode, result: { data } } = await patchRequest(
        endpoint, { action: 'accept' }, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(data.response_status, 'ACCEPTED');
    assert.equal(data.accept_count, 1);
    assert.equal(data.responses[0].response, true);
    assert.equal(data.responses[0].user.full_name, admin.fullName);
  });

  it('should send accept notification to admin', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;

    await patchRequest(endpoint, { action: 'accept' }, admin.token);

    assert.equal(notifier.send.called, true);
  });
});
