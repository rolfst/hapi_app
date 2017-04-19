const { assert } = require('chai');
const sinon = require('sinon');
const Promise = require('bluebird');
const Mixpanel = require('../../shared/services/mixpanel');
const notifier = require('../../shared/services/notifier');
const objectService = require('../core/services/object');
const networkService = require('../core/services/network');
const Dispatcher = require('./dispatcher');

describe('Feed: Dispatcher', () => {
  let sandbox;

  before(() => (sandbox = sinon.sandbox.create()));
  afterEach(() => sandbox.restore());

  describe('message.created', () => {
    const usersForParent = [
      { id: '1', email: 'foo@example.com' },
      { id: '2', email: 'baz@example.com' },
    ];

    it('should call getUsersForParent with correct args', async () => {
      sandbox.stub(notifier, 'send');
      sandbox.stub(objectService, 'usersForParent').returns(Promise.resolve(usersForParent));
      sandbox.stub(networkService, 'get').returns(Promise.resolve({
        networkId: '123', name: 'testNetwork' }));

      Dispatcher.emit('message.created', {
        actor: { fullName: 'John Doe' },
        networkId: '123',
        parent: { type: 'team', id: '12', name: 'Foo team' },
        object: { id: '35234', source: { id: '435', text: 'Jessica cannot work today.' } },
        credentials: { id: '111' },
      });

      await Promise.delay(1000);

      assert.deepEqual(objectService.usersForParent.firstCall.args[0], {
        parentType: 'team',
        parentId: '12',
      });
    });

    it('should return empty array when getUsersForParent doesnt support type', async () => {
      sandbox.stub(notifier, 'send');
      sandbox.stub(objectService, 'usersForParent').returns(Promise.reject(new Error('Failure')));
      sandbox.stub(networkService, 'get').returns(Promise.resolve({
        networkId: '123', name: 'testNetwork' }));

      Dispatcher.emit('message.created', {
        actor: { fullName: 'John Doe' },
        networkId: '123',
        parent: { type: 'nonexistingtype', id: '12', name: 'Foo team' },
        object: { id: '35234', source: { id: '435', text: 'Jessica cannot work today.' } },
        credentials: { id: '111' },
      });

      await Promise.delay(1000);

      assert.deepEqual(notifier.send.firstCall.args[0], []);
    });

    it('should send notification', async () => {
      sandbox.stub(notifier, 'send');
      sandbox.stub(objectService, 'usersForParent').returns(Promise.resolve(usersForParent));
      sandbox.stub(networkService, 'get').returns(Promise.resolve({
        networkId: '123', name: 'testNetwork' }));

      Dispatcher.emit('message.created', {
        actor: { id: '1', fullName: 'John Doe' },
        networkId: '123',
        parent: { type: 'team', id: '12', name: 'Foo team' },
        object: { id: '35234', source: { id: '435', text: 'Jessica cannot work today.' } },
        credentials: { id: '111' },
      });

      await Promise.delay(1000);

      assert.deepEqual(notifier.send.firstCall.args, [
        [{ id: '2', email: 'baz@example.com' }], {
          headings: 'John Doe in Foo team',
          text: 'Jessica cannot work today.',
          data: { id: '435', type: 'message', track_name: 'message_created' },
        }, '123']);
    });

    it('should send statistic', async () => {
      sandbox.stub(notifier, 'send');
      sandbox.stub(objectService, 'usersForParent').returns(Promise.resolve(usersForParent));
      sandbox.stub(networkService, 'get').returns(Promise.resolve({
        id: '123', name: 'testNetwork' }));
      sandbox.stub(Mixpanel, 'track').returns(Promise.resolve(true));

      Dispatcher.emit('message.created', {
        actor: { id: '1', fullName: 'John Doe' },
        networkId: '123',
        parent: { type: 'team', id: '12', name: 'Foo team' },
        object: { id: '35234', source: { id: '435', text: 'Jessica cannot work today.' } },
        credentials: { id: '111' },
      });

      await Promise.delay(1000);
      const actual = Mixpanel.track.firstCall.args[0];
      assert.equal(actual.name, 'Created Message');
      assert.equal(actual.data['Network Id'], '123');
      assert.equal(actual.data['Network Name'], 'testNetwork');
      assert.equal(actual.data['Placed In'], 'Team');
      assert.equal(actual.data['Team Id'], '12');
      assert.isDefined(actual.data['Created At']);
    });

    it('notification text without "in:" when parent name is not present', async () => {
      sandbox.stub(notifier, 'send');
      sandbox.stub(objectService, 'usersForParent').returns(Promise.resolve(usersForParent));
      sandbox.stub(networkService, 'get').returns(Promise.resolve({
        networkId: '123', name: 'testNetwork' }));

      Dispatcher.emit('message.created', {
        actor: { id: '1', fullName: 'John Doe' },
        networkId: '123',
        parent: { type: 'team', id: '12' },
        object: { id: '35234', source: { id: '435', text: 'Jessica cannot work today.' } },
        credentials: { id: '111' },
      });

      await Promise.delay(1000);

      assert.deepEqual(notifier.send.firstCall.args, [
        [{ id: '2', email: 'baz@example.com' }], {
          headings: 'John Doe',
          text: 'Jessica cannot work today.',
          data: { id: '435', type: 'message', track_name: 'message_created' },
        }, '123']);
    });
  });
});
