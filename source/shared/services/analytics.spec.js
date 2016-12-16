import Mixpanel from 'mixpanel';
import { assert } from 'chai';
import sinon from 'sinon';
import * as Analytics from './analytics';

describe('Service: Analytics', () => {
  const eventStub = {
    name: 'Push Notification Sent',
    data: { foo: 'baz' },
  };

  const defaultMixpanelAttributes = { mp_lib: 'node', token: 'foo_token' };
  const mixpanelClient = Mixpanel.init('foo_token');
  sinon.stub(Mixpanel, 'init').returns(mixpanelClient);

  it('should pass distinctId to mixpanel client', () => {
    const methodSpy = sinon.spy(mixpanelClient, 'track');
    Analytics.track(eventStub, 3);
    methodSpy.restore();

    assert.isTrue(methodSpy.calledOnce);
    assert.deepEqual(methodSpy.firstCall.args, [eventStub.name, {
      ...eventStub.data, ...defaultMixpanelAttributes, distinct_id: 3,
    }]);
  });

  it('should fail when no distinctId is present', () => {
    assert.throws(() => Analytics.track(eventStub, null, mixpanelClient));
  });
});
