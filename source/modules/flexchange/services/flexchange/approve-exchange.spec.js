import { assert } from 'chai';
import sinon from 'sinon';
import * as exchangeRepo from 'modules/flexchange/repositories/exchange';
import * as exchangeResponseRepo from '../../repositories/exchange-response';
import * as service from '../flexchange';
import * as creatorApproved from '../../notifications/creator-approved';
import * as substituteApproved from '../../notifications/substitute-approved';

describe('Approve exchange', () => {
  let sandbox;

  before(() => (sandbox = sinon.sandbox.create()));
  afterEach(() => (sandbox.restore()));

  it('should send a notifications to the approved user and owner of the shift', async () => {
    sandbox.stub(creatorApproved, 'send').returns(Promise.resolve(null));
    sandbox.stub(substituteApproved, 'send').returns(Promise.resolve(null));
    sandbox.stub(exchangeRepo, 'findExchangeById').returns({});
    sandbox.stub(exchangeRepo, 'approveExchange').returns({});
    sandbox.stub(exchangeResponseRepo, 'findResponseWhere')
      .returns({ approved: null, response: 1 });

    const messageFixture = { credentials: {}, network: {} };
    const payload = {
      exchangeId: null,
      user_id: 1,
    };
    await service.approveExchange(payload, messageFixture);

    assert.equal(creatorApproved.send.calledOnce, true);
    assert.equal(substituteApproved.send.calledOnce, true);
  });
});
