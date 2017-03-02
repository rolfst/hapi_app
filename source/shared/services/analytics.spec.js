import Mixpanel from 'mixpanel';
import { assert } from 'chai';
import sinon from 'sinon';
import * as Analytics from './analytics';

describe('Service: Analytics', () => {
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
    const mixpanelClient = Mixpanel.init('foo_token');
    sandbox.stub(Mixpanel, 'init').returns(mixpanelClient);
    const methodSpy = sinon.spy(mixpanelClient, 'track');
    Analytics.track(eventStub, 3);
    methodSpy.restore();

    assert.isTrue(methodSpy.calledOnce);
    assert.deepEqual(methodSpy.firstCall.args, [eventStub.name, {
      ...eventStub.data, ...defaultMixpanelAttributes, distinct_id: 3,
    }]);
  });

  it('should fail when no distinctId is present', () => {
    const mixpanelClient = Mixpanel.init('foo_token');
    sandbox.stub(Mixpanel, 'init').returns(mixpanelClient);
    assert.throws(() => Analytics.track(eventStub, null, mixpanelClient));
  });
});
