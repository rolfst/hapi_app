import { assert } from 'chai';
import * as dispatcher from './dispatcher';

describe('Service: Dispatcher', () => {
  it('should call the listeners', () => {
    const listenerSpy = sinon.spy();
    const fakeListeners = [
      listenerSpy,
    ];

    dispatcher.dispatchEvent('Foo', { foo: 'baz' }, fakeListeners);

    assert.isTrue(listenerSpy.calledOnce);
    assert.deepEqual(listenerSpy.firstCall.args, ['Foo', { foo: 'baz' }]);
  });
});
