const { assert } = require('chai');
const sinon = require('sinon');
const userService = require('../../../core/services/user');
const exchangeRepo = require('../../repositories/exchange');
const service = require('../../services/flexchange');
const notification = require('../../notifications/accepted-exchange');

describe('Accept exchange', () => {
  let sandbox;

  before(() => (sandbox = sinon.sandbox.create()));
  afterEach(() => (sandbox.restore()));

  it.skip('should send a notification to the whole network', async () => {
    const messageFixture = { credentials: {}, network: {} };
    const exchangeFixture = { ResponseStatus: {} };
    const payload = { exchangeId: null };

    sandbox.stub(notification, 'send').returns(Promise.resolve(null));
    sandbox.stub(notification, 'createNotification').returns(Promise.resolve(null));
    sandbox.stub(exchangeRepo, 'findExchangeById').returns(exchangeFixture);
    sandbox.stub(exchangeRepo, 'acceptExchange').returns(null);
    sandbox.stub(userService, 'getUser').returns({});

    await service.acceptExchange(payload, messageFixture);

    assert.equal(notification.send.calledOnce, true);
  });
});
