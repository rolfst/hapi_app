const Mixpanel = require('mixpanel');
const { assert } = require('chai');
const sinon = require('sinon');
const Parse = require('parse/node');
const notifier = require('./notifier');

describe('Notifier', () => {
  let sandbox;

  afterEach(() => sandbox.restore());
  beforeEach(() => { sandbox = sinon.sandbox.create(); });

  describe('send', () => {
    it.skip('should track push notifications', () => {
      const mixpanelClient = Mixpanel.init('foo_token');
      sandbox.stub(Mixpanel, 'init').returns(mixpanelClient);
      const methodSpy = sandbox.stub(mixpanelClient, 'track');
      sandbox.stub(Parse.Push, 'send').returns(Promise.resolve(null));

      const notificationStub = {
        text: 'Foo notification text',
        data: { id: '1', type: 'foo', track_name: 'foo_track_id' },
      };

      const users = [
        { id: '1', username: 'test1@flex-appeal.nl', email: 'test1@flex-appeal.nl' },
        { id: '2', username: 'test2@flex-appeal.nl', email: 'test2@flex-appeal.nl' },
      ];

      notifier.send(users, notificationStub);

      assert.equal(methodSpy.callCount, 2);
    });
  });
});
