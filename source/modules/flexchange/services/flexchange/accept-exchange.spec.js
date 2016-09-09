import { assert } from 'chai';
import sinon from 'sinon';
import * as exchangeRepo from 'modules/flexchange/repositories/exchange';
import * as service from 'modules/flexchange/services/flexchange';
import * as notification from 'modules/flexchange/notifications/accepted-exchange';
import * as networkUtil from 'common/utils/network';

describe('Accept exchange', () => {
  let sandbox;

  before(() => (sandbox = sinon.sandbox.create()));
  afterEach(() => (sandbox.restore()));

  it('should send a notification to the whole network', async () => {
    const messageFixture = { credentials: {}, network: {} };
    const exchangeFixture = { ResponseStatus: {} };
    const payload = {
      exchangeId: null,
    };

    sandbox.stub(notification, 'send').returns(Promise.resolve(null));
    sandbox.stub(exchangeRepo, 'findExchangeById').returns(exchangeFixture);
    sandbox.stub(exchangeRepo, 'acceptExchange').returns(null);
    sandbox.stub(networkUtil, 'hasIntegration').returns(null);

    await service.acceptExchange(payload, messageFixture);

    assert.equal(notification.send.calledOnce, true);
  });
});
