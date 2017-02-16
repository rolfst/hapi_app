import { assert } from 'chai';
import sinon from 'sinon';
import Promise from 'bluebird';
import * as notifier from '../../shared/services/notifier';
import * as objectService from './services/object';
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

      Dispatcher.emit('message.created', {
        actor: { fullName: 'John Doe' },
        networkId: '123',
        parent: { type: 'team', id: '12', name: 'Foo team' },
        object: { id: '35234', source: { id: '435', text: 'Jessica cannot work today.' } },
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

      Dispatcher.emit('message.created', {
        actor: { fullName: 'John Doe' },
        networkId: '123',
        parent: { type: 'nonexistingtype', id: '12', name: 'Foo team' },
        object: { id: '35234', source: { id: '435', text: 'Jessica cannot work today.' } },
      });

      await Promise.delay(1000);

      assert.deepEqual(notifier.send.firstCall.args[0], []);
    });

    it('should send notification', async () => {
      sandbox.stub(notifier, 'send');
      sandbox.stub(objectService, 'usersForParent').returns(Promise.resolve(usersForParent));

      Dispatcher.emit('message.created', {
        actor: { fullName: 'John Doe' },
        networkId: '123',
        parent: { type: 'team', id: '12', name: 'Foo team' },
        object: { id: '35234', source: { id: '435', text: 'Jessica cannot work today.' } },
      });

      await Promise.delay(1000);

      assert.deepEqual(notifier.send.firstCall.args, [usersForParent, {
        text: 'John Doe in Foo team: Jessica cannot work today.',
        data: { id: '435', type: 'message', track_name: 'message_created' },
      }, '123']);
    });

    it('notification text without "in:" when parent name is not present', async () => {
      sandbox.stub(notifier, 'send');
      sandbox.stub(objectService, 'usersForParent').returns(Promise.resolve(usersForParent));

      Dispatcher.emit('message.created', {
        actor: { fullName: 'John Doe' },
        networkId: '123',
        parent: { type: 'team', id: '12' },
        object: { id: '35234', source: { id: '435', text: 'Jessica cannot work today.' } },
      });

      await Promise.delay(1000);

      assert.deepEqual(notifier.send.firstCall.args, [usersForParent, {
        text: 'John Doe: Jessica cannot work today.',
        data: { id: '435', type: 'message', track_name: 'message_created' },
      }, '123']);
    });
  });
});
