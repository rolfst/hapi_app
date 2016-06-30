import { assert } from 'chai';
import sinon from 'sinon';
import * as exchangeRepo from 'modules/flexchange/repositories/exchange';
import * as handler from 'modules/flexchange/handlers/accept-exchange';
import * as notification from 'modules/flexchange/notifications/accepted-exchange';
import * as hasIntegration from 'common/utils/network-has-integration';

describe('Accept exchange', () => {
  let sandbox;

  before(() => (sandbox = sinon.sandbox.create()));
  afterEach(() => (sandbox.restore()));

  it('should send a notification to the whole network', async () => {
    sandbox.stub(notification, 'send').returns(Promise.resolve(null));
    sandbox.stub(exchangeRepo, 'acceptExchange').returns(null);
    sandbox.stub(hasIntegration, 'default').returns(null);

    const networkFixture = {};
    const exchangeFixture = { ResponseStatus: {} };
    const requestFixture = {
      auth: { credentials: {} },
      params: { exchangeId: null },
    };

    await handler.default(networkFixture, exchangeFixture, requestFixture);

    assert.equal(notification.send.calledOnce, true);
  });
});
