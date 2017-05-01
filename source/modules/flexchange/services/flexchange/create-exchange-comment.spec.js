const { assert } = require('chai');
const sinon = require('sinon');
const userService = require('../../../core/services/user');
const service = require('../flexchange');
const commentRepo = require('../../repositories/comment');

// TODO notification send needs to be activated
// const notification = require('../../notifications/new-exchange-comment');

describe('Create exchange comment', () => {
  let sandbox;

  before(() => (sandbox = sinon.sandbox.create()));
  afterEach(() => (sandbox.restore()));

  it('should send a notification to the whole network', async () => {
    sandbox.stub(commentRepo, 'createExchangeComment').returns({});
    sandbox.stub(commentRepo, 'findCommentById').returns({ toJSON: () => '' });
    sandbox.stub(userService, 'getUser').returns(Promise.resolve({}));

    const messageFixture = { credentials: {}, network: {} };
    const payload = {
      shiftId: 2,
      exchangeId: null,
      text: 'test',
    };

    await service.createExchangeComment(payload, messageFixture);

    assert.equal(commentRepo.createExchangeComment.calledOnce, true);
    assert.equal(commentRepo.createExchangeComment.calledOnce, true);

    // TODO notification send needs to be activated
    // assert.equal(notification.send.calledOnce, true);
  });
});
