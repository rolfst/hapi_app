const { assert } = require('chai');
const Mixpanel = require('mixpanel');
const nock = require('nock');
const R = require('ramda');
const sinon = require('sinon');
const MixpanelService = require('./mixpanel');

const API_SECRET = process.env.MIXPANEL_SECRET;

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
    const mixpanelClient = Mixpanel.init('foo_token');
    sandbox.stub(Mixpanel, 'init').returns(mixpanelClient);
    const methodSpy = sinon.spy(mixpanelClient, 'track');
    MixpanelService.track(eventStub, 3);
    methodSpy.restore();

    assert.isTrue(methodSpy.calledOnce);
    assert.deepEqual(methodSpy.firstCall.args, [eventStub.name, R.mergeAll([
      eventStub.data, defaultMixpanelAttributes, { distinct_id: 3 }]),
    ]);
  });

  it('should fail when no distinctId is present', () => {
    const mixpanelClient = Mixpanel.init('foo_token');
    sandbox.stub(Mixpanel, 'init').returns(mixpanelClient);

    assert.throws(() => MixpanelService.track(eventStub, null, mixpanelClient));
  });

  it('should work when mixpanel returns empty array', async () => {
    sandbox.stub(MixpanelService, 'handleRequest').returns(Promise.resolve([]));
    nock('https://mixpanel.com:443', { encodedQueryParams: true })
      .post('/api/2.0/jql/', 'script=')
      .reply(200, []);
    const actual = await MixpanelService.executeQuery('', {});
    assert.deepEqual(actual, { payload: [], status: 200 });
  });
});
