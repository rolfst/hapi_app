import { assert } from 'chai';
import sinon from 'sinon';
import * as notifier from '../../../../shared/services/notifier';
import * as mailer from '../../../../shared/services/mailer';
import * as responseUtils from '../../../../shared/utils/response';
import * as socketService from '../../../../shared/services/socket';
import * as impl from './implementation';
import * as responseUtils from '../../../../shared/utils/response';
import * as socketService from '../../../../shared/services/socket';
import * as newMessageNotification from '../../notifications/new-message';
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

  describe('notifyUsersForNewMessage', () => {
    const messageStub = {
      text: 'Foo message',
      createdBy: { id: 1, fullName: 'Foo Baz' },
      conversation: { id: 1 },
    };

    const expectedUsersToNotify = [{ id: 2 }];

    it('should send push notification', () => {
      sandbox.stub(newMessageNotification, 'send');

      impl.notifyUsersForNewMessage(conversationStub, messageStub, 'foo_token');

      assert.isTrue(newMessageNotification.send.calledWithMatch(
        messageStub, expectedUsersToNotify));

      newMessageNotification.send.restore();
    });

    it('should send socket event', () => {
      sandbox.stub(socketService, 'send');

      impl.notifyUsersForNewMessage(conversationStub, messageStub, 'foo_token');

      const actual = socketService.send.firstCall.args;
      const payload = { data: responseUtils.toSnakeCase(messageStub) };
      const expected = ['send-message', expectedUsersToNotify, payload, 'foo_token'];

      assert.deepEqual(actual, expected);

      socketService.send.restore();
    });
  });
});
