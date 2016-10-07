import { assert } from 'chai';
import sinon from 'sinon';
import * as impl from './implementation';
import * as socketService from '../../../../shared/services/socket';
import * as newMessageNotification from '../../notifications/new-message';

describe('Conversation Service implementation', () => {
  const conversationStub = { Users: [{ id: 1 }, { id: 2 }] };

  describe('assertThatUserIsPartOfTheConversation', () => {
    it('should return correct assertion', () => {
      assert.equal(impl.assertThatUserIsPartOfTheConversation(conversationStub, 1), true);
      assert.equal(impl.assertThatUserIsPartOfTheConversation(conversationStub, 3), false);
    });
  });

  describe('notifyUsersForNewMessage', () => {
    const messageStub = {
      text: 'Foo message',
      createdBy: 1,
      User: {
        fullName: 'Foo Baz',
      },
      Conversation: {
        id: 1,
      },
      toJSON: () => ({ text: 'Foo message' }),
    };

    const expectedUsersToNotify = [{ id: 2 }];

    it('should send push notification', () => {
      sinon.stub(newMessageNotification, 'send');

      impl.notifyUsersForNewMessage(conversationStub, messageStub, 'foo_token');

      assert.isTrue(newMessageNotification.send.calledWithMatch(
        messageStub, expectedUsersToNotify));

      newMessageNotification.send.restore();
    });

    it('should send socket event', () => {
      sinon.stub(socketService, 'send');

      impl.notifyUsersForNewMessage(conversationStub, messageStub, 'foo_token');

      assert.isTrue(socketService.send.calledWithMatch(
        'send-message', expectedUsersToNotify, messageStub.toJSON(), 'foo_token'));

      socketService.send.restore();
    });
  });
});
