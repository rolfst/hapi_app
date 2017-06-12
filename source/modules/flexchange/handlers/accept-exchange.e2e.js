const { assert } = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const R = require('ramda');
const testHelper = require('../../../shared/test-utils/helpers');
const { patchRequest } = require('../../../shared/test-utils/request');
const objectRepository = require('../../core/repositories/object');
const { exchangeTypes } = require('../repositories/dao/exchange');
const exchangeService = require('../services/flexchange');
const dispatcher = require('../dispatcher');
const Mixpanel = require('../../../shared/services/mixpanel');
const Intercom = require('../../../shared/services/intercom');
const creatorNotifier = require('../notifications/creator-approved');
const acceptanceNotifier = require('../notifications/accepted-exchange');
const createdNotifier = require('../notifications/exchange-created');
const substituteNotifier = require('../notifications/substitute-approved');

describe('Accept exchange', () => {
  let sandbox;
  let network;
  let admin;
  let exchange;

  let dispatcherEmitSpy;

  before(async () => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(Mixpanel, 'track');
    sandbox.stub(creatorNotifier, 'send');
    sandbox.stub(createdNotifier, 'send');
    sandbox.stub(substituteNotifier, 'send');
    sandbox.stub(acceptanceNotifier, 'send').returns(Promise.resolve(true));
    sandbox.stub(Intercom, 'createEvent');
    sandbox.stub(Intercom, 'incrementAttribute');
    dispatcherEmitSpy = sandbox.spy(dispatcher, 'emit');

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

  it('shouldve dispatched with the right properties', async () => {
    assert(dispatcherEmitSpy.called);

    const args = R.find((argPair) => argPair[0] === 'exchange.accepted', dispatcherEmitSpy.args);

    assert.isDefined(args);
    assert.isNumber(args[1].acceptedExchange);
    assert.isObject(args[1].acceptanceUser);
    assert.isObject(args[1].network);
  });
});
