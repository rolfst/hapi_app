import { assert } from 'chai';
import sinon from 'sinon';
import * as unit from 'common/utils/create-adapter';

describe('createAdapter', () => {
  const network = { name: 'My network', Integrations: [{ name: 'foo' }] };
  const authSettings = [{ name: 'foo', token: 'footoken' }];

  it('should pass network and token to adapter', () => {
    const adapterSpy = sinon.spy();
    const fakeIntegrations = [{ name: 'foo', adapter: adapterSpy }];

    unit.default(network, authSettings, { integrations: fakeIntegrations });

    assert.isTrue(adapterSpy.calledWith(network, 'footoken'));
    assert.isTrue(adapterSpy.calledOnce);

    adapterSpy.reset();
  });

  it('should return the adapter', () => {
    const fakeAdapter = () => ({ foo: 'baz' });
    const fakeIntegrations = [{ name: 'foo', adapter: fakeAdapter }];

    const actual = unit.default(network, authSettings, { integrations: fakeIntegrations });

    assert.deepEqual(actual, { foo: 'baz' });
  });

  it('should proceed without token', () => {
    const fakeAdapter = () => ({ foo: 'baz' });
    const fakeIntegrations = [{ name: 'foo', adapter: fakeAdapter }];

    const actual = unit.default(network, [], {
      proceedWithoutToken: true,
      integrations: fakeIntegrations,
    });

    assert.deepEqual(actual, { foo: 'baz' });
  });

  it('should fail when no adapter found', () => {
    const actual = () => unit.default(network, authSettings, { integrations: {} });

    assert.throws(actual);
  });

  it('should fail when no token found', () => {
    const fakeAdapter = () => ({ foo: 'baz' });
    const fakeIntegrations = [{ name: 'foo', adapter: fakeAdapter }];

    const actual = () => unit.default(network, [], { integrations: fakeIntegrations });

    assert.throws(actual);
  });
});
