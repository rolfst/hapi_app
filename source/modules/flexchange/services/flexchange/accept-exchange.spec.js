import { assert } from 'chai';
import sinon from 'sinon';
import * as networkUtil from '../../../../shared/utils/network';
import * as userService from '../../../core/services/user';
import * as exchangeRepo from '../../repositories/exchange';
import * as service from '../../services/flexchange';
import * as notification from '../../notifications/accepted-exchange';

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
    sandbox.stub(notification, 'createNotification').returns(Promise.resolve(null));
    sandbox.stub(exchangeRepo, 'findExchangeById').returns(exchangeFixture);
    sandbox.stub(exchangeRepo, 'acceptExchange').returns(null);
    sandbox.stub(networkUtil, 'hasIntegration').returns(null);
    sandbox.stub(userService, 'getUser').returns({});

    await service.acceptExchange(payload, messageFixture);


    assert.equal(notification.send.calledOnce, true);
  });
});
