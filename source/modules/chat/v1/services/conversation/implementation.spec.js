import { assert } from 'chai';
import sinon from 'sinon';
import * as notifier from '../../../../../shared/services/notifier';
import * as mailer from '../../../../../shared/services/mailer';
import * as impl from './implementation';

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
