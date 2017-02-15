import { assert } from 'chai';
import sinon from 'sinon';
import * as notifier from '../../shared/services/notifier';
import Dispatcher from './dispatcher';

describe.only('Feed: Dispatcher', () => {
  let sandbox;

  before(() => (sandbox = sinon.sandbox.create()));
  afterEach(() => sandbox.restore());

  describe('message.created', () => {
    it('should send notification', async () => {
      sandbox.stub(notifier, 'send');

      await Dispatcher.emit('message.created', {
        actor: { fullName: 'John Doe' },
        parent: { type: 'team', id: '12', name: 'Foo team' },
        message: { id: '435', text: 'Jessica cannot work today.' },
      });

      assert.deepEqual(notifier.send.firstCall.args, [[], {
        text: 'John Doe in Foo team: Jessica cannot work today.',
        data: { id: '435', type: 'message', track_name: 'message_created' },
      }]);
    });

    it('notification text without "in:" when parent name is not present', async () => {
      sandbox.stub(notifier, 'send');

      await Dispatcher.emit('message.created', {
        actor: { fullName: 'John Doe' },
        parent: { type: 'team', id: '12' },
        message: { id: '435', text: 'Jessica cannot work today.' },
      });

      assert.deepEqual(notifier.send.firstCall.args, [[], {
        text: 'John Doe: Jessica cannot work today.',
        data: { id: '435', type: 'message', track_name: 'message_created' },
      }]);
    });
  });
});
