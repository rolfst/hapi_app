import { assert } from 'chai';
import sinon from 'sinon';
import * as service from '../services/flexchange';
import * as commentRepo from '../repositories/comment';
import * as networkUtil from '../../../common/utils/network';

// TODO notification send needs to be activated
// import * as notification from '../notifications/new-exchange-comment';

describe('Create exchange comment', () => {
  let sandbox;

  before(() => (sandbox = sinon.sandbox.create()));
  afterEach(() => (sandbox.restore()));

  it('should send a notification to the whole network', async () => {
    sandbox.stub(networkUtil, 'hasIntegration').returns(null);
    sandbox.stub(commentRepo, 'createExchangeComment').returns({});
    sandbox.stub(commentRepo, 'findCommentById').returns({ toJSON: () => '' });

    const messageFixture = { credentials: {}, network: {} };
    const payload = {
      shiftId: 2,
      exchangeId: null,
      text: 'test',
    };

    await service.getExchangeComment(payload, messageFixture);

    assert.equal(commentRepo.createExchangeComment.calledOnce, true);
    assert.equal(commentRepo.createExchangeComment.calledOnce, true);

    // TODO notification send needs to be activated
    // assert.equal(notification.send.calledOnce, true);
  });
});
