const R = require('ramda');
const { assert } = require('chai');
const moment = require('moment');
const sinon = require('sinon');
const Promise = require('bluebird');
const testHelper = require('../../../shared/test-utils/helpers');
const { patchRequest } = require('../../../shared/test-utils/request');
const objectRepository = require('../../core/repositories/object');
const { exchangeTypes } = require('../repositories/dao/exchange');
const exchangeService = require('../services/flexchange');
const dispatcher = require('../dispatcher');
const Mixpanel = require('../../../shared/services/mixpanel');
const Intercom = require('../../../shared/services/intercom');
const acceptanceNotifier = require('../notifications/accepted-exchange');
const creatorNotifier = require('../notifications/creator-approved');
const createdNotifier = require('../notifications/exchange-created');
const substituteNotifier = require('../notifications/substitute-approved');

describe('Approve exchange', () => {
  let sandbox;
  let admin;
  let employee;
  let network;
  let acceptedExchange;
  let rejectedExchange;

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

  after(() => {
    sandbox.restore();
    return testHelper.cleanAll();
  });

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

  it('shouldve dispatched with the right properties', async () => {
    assert(dispatcherEmitSpy.called);

    const args = R.find((argPair) => argPair[0] === 'exchange.approved', dispatcherEmitSpy.args);

    assert.isDefined(args);
    assert.isObject(args[1].exchange.ApprovedUser);
    assert.isObject(args[1].exchange.User);
    assert.isObject(args[1].exchange.Approver);
    assert.isObject(args[1].exchange);
    assert.isObject(args[1].network);
  });
});
