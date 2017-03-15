import { assert } from 'chai';
import sinon from 'sinon';
import Promise from 'bluebird';
import * as Mixpanel from '../../shared/services/mixpanel';
import * as notifier from '../../shared/services/notifier';
import * as objectService from '../core/services/object';
import * as networkService from '../core/services/network';
import Dispatcher from './dispatcher';

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

      debugger;
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
          text: 'John Doe in Foo team: Jessica cannot work today.',
          data: { id: '435', type: 'message', track_name: 'message_created' },
        }, '123']);
    });

    it.only('should send statistic', async () => {
      sandbox.stub(notifier, 'send');
      sandbox.stub(objectService, 'usersForParent').returns(Promise.resolve(usersForParent));
      sandbox.stub(networkService, 'get').returns(Promise.resolve({
        networkId: '123', name: 'testNetwork' }));
      sandbox.stub(Mixpanel, 'track').returns(Promise.resolve(true));

      Dispatcher.emit('message.created', {
        actor: { id: '1', fullName: 'John Doe' },
        networkId: '123',
        parent: { type: 'team', id: '12', name: 'Foo team' },
        object: { id: '35234', source: { id: '435', text: 'Jessica cannot work today.' } },
        credentials: { id: '111' },
      });

      await Promise.delay(1000);

      assert.deepEqual(Mixpanel.track.firstCall.args, [
        { name: 'Created Message',
          data: { 'Network Id': '123', 'Network Name': 'testNetwork', 'Placed In': 'Team' },
        }, '111']);
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
          text: 'John Doe: Jessica cannot work today.',
          data: { id: '435', type: 'message', track_name: 'message_created' },
        }, '123']);
    });
  });
});
