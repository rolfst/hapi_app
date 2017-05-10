const Mixpanel = require('mixpanel');
const { assert } = require('chai');
const sinon = require('sinon');
const notifier = require('./notifier');

describe('Notifier', () => {
  const mixpanelClient = Mixpanel.init('foo_token');
  let sandbox;

  before(() => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(Mixpanel, 'init').returns(mixpanelClient);
    sandbox.stub(mixpanelClient, 'track');
    sandbox.stub(notifier, 'sendNotification')
      .returns(new Promise((resolve) => resolve({ ok: true })));
  });
  afterEach(() => sandbox.restore());

  describe('send', () => {
    it('should create chunks', () => {
      const users = [
        { email: 'foo+1@flex-appeal.nl' },
        { email: 'foo+2@flex-appeal.nl' },
        { email: 'foo+3@flex-appeal.nl' },
      ];

      const expected = [
        ['foo+1@flex-appeal.nl', 'foo+2@flex-appeal.nl'],
        ['foo+3@flex-appeal.nl'],
      ];
      const actual = notifier.createEmailChunks(users, 2);

      assert.deepEqual(actual, expected);
    });

    it('should create correct data', () => {
      const notification = { data: { foo: 'test' } };
      const emails = ['foo+1@flex-appeal.nl', 'foo+2@flex-appeal.nl'];
      const payload = { organisationId: '1', networkId: '2' };

      const expected = [
        { field: 'email', value: 'foo+1@flex-appeal.nl' },
        { operator: 'OR' },
        { field: 'email', value: 'foo+2@flex-appeal.nl' },
      ];
      const actual = notifier.createData(notification, payload, emails);

      assert.deepEqual(actual.data, { foo: 'test', organisation_id: '1', network_id: '2' });
      assert.deepEqual(actual.filters, expected);
    });

    it.skip('should track push notifications', () => {
      const notifications = {
        text: 'Foo notification text',
        data: { id: '1', type: 'foo', track_name: 'foo_track_id' },
      };

      const users = [
        { id: '1', username: 'test1@flex-appeal.nl', email: 'test1@flex-appeal.nl' },
        { id: '2', username: 'test2@flex-appeal.nl', email: 'test2@flex-appeal.nl' },
      ];

      notifier.send(users, notifications).catch(console.log);

      assert.equal(mixpanelClient.track.callCount, 2);
    });
  });
});
