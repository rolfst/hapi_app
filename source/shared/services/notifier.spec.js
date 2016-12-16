import Mixpanel from 'mixpanel';
import { assert } from 'chai';
import sinon from 'sinon';
import Parse from 'parse/node';
import * as notifier from './notifier';

describe('Notifier', () => {
  before(() => notifier.send.restore());
  after(() => sinon.stub(notifier, 'send').returns(null));

  describe('createEmailList', () => {
    it('should return the right receivers', () => {
      const users = [
        { fullName: 'Test1', email: 'test1@flex-appeal.nl' },
        { fullName: 'Test2', email: 'test2@flex-appeal.nl' },
        { fullName: 'Test3' },
      ];
      const expected = ['test1@flex-appeal.nl', 'test2@flex-appeal.nl'];

      const receivers = notifier.createEmailList(users);

      assert.equal(receivers.length, 2);
      assert.deepEqual(receivers, expected);
    });
  });

  describe('send', () => {
    it('should track push notifications', () => {
      Mixpanel.init.restore();
      const mixpanelClient = Mixpanel.init('foo_token');
      sinon.stub(Mixpanel, 'init').returns(mixpanelClient);
      const methodSpy = sinon.stub(mixpanelClient, 'track');
      sinon.stub(Parse.Push, 'send').returns(Promise.resolve(null));

      const notificationStub = {
        text: 'Foo notification text',
        data: { id: '1', type: 'foo', track_name: 'foo_track_id' },
      };

      const users = [
        { id: '1', username: 'test1@flex-appeal.nl', email: 'test1@flex-appeal.nl' },
        { id: '2', username: 'test2@flex-appeal.nl', email: 'test2@flex-appeal.nl' },
      ];

      notifier.send(users, notificationStub);
      methodSpy.restore();

      assert.equal(methodSpy.callCount, 2);
    });
  });
});
