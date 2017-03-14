import _Mixpanel from 'mixpanel';
import { assert } from 'chai';
import sinon from 'sinon';
import * as Mixpanel from './mixpanel';

describe('Service: mixpanel', () => {
  let sandbox;

  afterEach(() => sandbox.restore());
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  const eventStub = {
    name: 'Push Notification Sent',
    data: { foo: 'baz' },
  };

  const defaultMixpanelAttributes = { mp_lib: 'node', token: 'foo_token' };

  it('should pass distinctId to mixpanel client', () => {
    const mixpanelClient = _Mixpanel.init('foo_token');
    sandbox.stub(_Mixpanel, 'init').returns(mixpanelClient);
    const methodSpy = sinon.spy(mixpanelClient, 'track');
    Mixpanel.track(eventStub, 3);
    methodSpy.restore();

    assert.isTrue(methodSpy.calledOnce);
    assert.deepEqual(methodSpy.firstCall.args, [eventStub.name, {
      ...eventStub.data, ...defaultMixpanelAttributes, distinct_id: 3,
    }]);
  });

  it('should fail when no distinctId is present', () => {
    const mixpanelClient = _Mixpanel.init('foo_token');
    sandbox.stub(_Mixpanel, 'init').returns(mixpanelClient);

    assert.throws(() => Mixpanel.track(eventStub, null, mixpanelClient));
  });
});