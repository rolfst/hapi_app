const { assert } = require('chai');
const moment = require('moment');
const sinon = require('sinon');
const R = require('ramda');
const testHelper = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');
const { exchangeTypes } = require('../repositories/dao/exchange');
const { createExchange } = require('../repositories/exchange');
const dispatcher = require('../dispatcher');
const Mixpanel = require('../../../shared/services/mixpanel');
const Intercom = require('../../../shared/services/intercom');
const creatorNotifier = require('../notifications/creator-approved');
const acceptanceNotifier = require('../notifications/accepted-exchange');
const createdNotifier = require('../notifications/exchange-created');
const substituteNotifier = require('../notifications/substitute-approved');

describe('Create exchange comment', () => {
  let admin;
  let network;
  let exchange;

  let sandbox;
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
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
    exchange = await createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift 1 for network',
    });
  });

  after(() => {
    sandbox.restore();
    return testHelper.cleanAll()
  });

  it('should create comment for exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/comments`;
    const payload = { text: 'New comment text' };
    const { result, statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(result.data.text, 'New comment text');
    assert.equal(result.data.user.id, admin.id);
    assert.equal(statusCode, 200);
  });

  it('shouldve dispatched with the right properties', async () => {
    assert(dispatcherEmitSpy.called);

    const args = R.find((argPair) => argPair[0] === 'exchange.comment', dispatcherEmitSpy.args);

    assert.isDefined(args);
    assert.isObject(args[1].exchangeComment);
    assert.isObject(args[1].network);
  });
});
