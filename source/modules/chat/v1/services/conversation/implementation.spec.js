const { assert } = require('chai');
const sinon = require('sinon');
const notifier = require('../../../../../shared/services/notifier');
const mailer = require('../../../../../shared/services/mailer');
const impl = require('./implementation');

describe('Conversation Service implementation', () => {
  let sandbox;
  const conversationStub = { users: [{ id: 1 }, { id: 2 }] };

  before(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(notifier, 'send').returns(null);
    sandbox.stub(mailer, 'send').returns(null);
  });
  after(() => sandbox.restore());

  describe('assertThatUserIsPartOfTheConversation', () => {
    it('should return correct assertion', () => {
      assert.equal(impl.assertThatUserIsPartOfTheConversation(conversationStub, 1), true);
      assert.equal(impl.assertThatUserIsPartOfTheConversation(conversationStub, 3), false);
    });
  });
});
