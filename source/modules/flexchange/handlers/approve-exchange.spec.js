import { assert } from 'chai';
import sinon from 'sinon';
import * as exchangeRepo from 'modules/flexchange/repositories/exchange';
import * as exchangeResponseRepo from 'modules/flexchange/repositories/exchange-response';
import * as handler from 'modules/flexchange/handlers/approve-exchange';
import * as creatorApproved from '../notifications/creator-approved';
import * as substituteApproved from '../notifications/substitute-approved';

describe('Approve exchange', () => {
  let sandbox;

  before(() => (sandbox = sinon.sandbox.create()));
  afterEach(() => (sandbox.restore()));

  it('should send a notifications to the approved user and owner of the shift', async () => {
    sandbox.stub(creatorApproved, 'send').returns(Promise.resolve(null));
    sandbox.stub(substituteApproved, 'send').returns(Promise.resolve(null));
    sandbox.stub(exchangeRepo, 'findExchangeById').returns({});
    sandbox.stub(exchangeRepo, 'approveExchange').returns({});
    sandbox.stub(exchangeResponseRepo, 'findExchangeResponseByExchangeAndUser')
      .returns({ approved: null, response: 1 });

    const networkFixture = {};
    const requestFixture = {
      auth: { credentials: {} },
      params: { exchangeId: null },
      payload: { user_id: 1 },
    };

    await handler.default(networkFixture, requestFixture);

    assert.equal(creatorApproved.send.calledOnce, true);
    assert.equal(substituteApproved.send.calledOnce, true);
  });
});
