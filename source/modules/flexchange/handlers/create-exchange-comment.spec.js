import { assert } from 'chai';
import sinon from 'sinon';
import * as handler from 'modules/flexchange/handlers/create-exchange-comment';
import * as commentRepo from 'modules/flexchange/repositories/comment';
import * as hasIntegration from 'common/utils/network-has-integration';
import * as notification from 'modules/flexchange/notifications/new-exchange-comment';

describe('Create exchange comment', () => {
  let sandbox;

  before(() => (sandbox = sinon.sandbox.create()));
  afterEach(() => (sandbox.restore()));

  it('should send a notification to the whole network', async () => {
    sandbox.stub(hasIntegration, 'default').returns(null);
    sandbox.stub(commentRepo, 'createExchangeComment').returns({});
    sandbox.stub(commentRepo, 'findCommentById').returns({ toJSON: () => '' });
    sandbox.stub(notification, 'send').returns(Promise.resolve(null));

    const requestFixture = {
      pre: { network: {} },
      auth: { credentials: {} },
      params: { exchangeId: null },
      payload: { text: 'test' },
    };

    await handler.default(requestFixture, () => false);

    assert.equal(notification.send.calledOnce, true);
  });
});
