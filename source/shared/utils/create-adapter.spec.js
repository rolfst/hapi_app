import { assert } from 'chai';
import sinon from 'sinon';
import * as unit from '../utils/create-adapter';

describe('createAdapter', () => {
  const integrationName = 'foo';
  const network = { name: 'My network', integrations: [integrationName] };
  const authSettings = [{ name: integrationName, token: 'footoken' }];

  it('should pass network and token to adapter', () => {
    const adapterSpy = sinon.spy();
    const fakeIntegrations = [{ name: 'foo', adapter: adapterSpy }];

    unit.createAdapter(network, authSettings, { integrations: fakeIntegrations });

    assert.isTrue(adapterSpy.calledWith(network, 'footoken'));
    assert.isTrue(adapterSpy.calledOnce);

    adapterSpy.reset();
  });

  it('should return the adapter', () => {
    const fakeAdapter = () => ({ foo: 'baz' });
    const fakeIntegrations = [{ name: 'foo', adapter: fakeAdapter }];

    const actual = unit.createAdapter(network, authSettings, { integrations: fakeIntegrations });

    assert.deepEqual(actual, { foo: 'baz' });
  });

  it('should proceed without token', () => {
    const fakeAdapter = () => ({ foo: 'baz' });
    const fakeIntegrations = [{ name: 'foo', adapter: fakeAdapter }];

    const actual = unit.createAdapter(network, [], {
      proceedWithoutToken: true,
      integrations: fakeIntegrations,
    });

    assert.deepEqual(actual, { foo: 'baz' });
  });

  it('should fail when no adapter found', () => {
    const actual = () => unit.createAdapter(network, authSettings, { integrations: {} });

    assert.throws(actual);
  });

  it('should fail when no token found', () => {
    const fakeAdapter = () => ({ foo: 'baz' });
    const fakeIntegrations = [{ name: 'foo', adapter: fakeAdapter }];

    const actual = () => unit.createAdapter(network, [], { integrations: fakeIntegrations });

    assert.throws(actual);
  });

  it('should create an adapter', () => {
    const adapterSpy = sinon.spy();
    const fakeIntegrations = [{ name: integrationName, adapter: adapterSpy }];

    const factory = unit.createAdapterFactory(
      integrationName, authSettings, { integrations: fakeIntegrations });
    factory.create(network);

    assert.isTrue(adapterSpy.calledWith(network, 'footoken'));
    assert.isTrue(adapterSpy.calledOnce);

    adapterSpy.reset();
  });

  it('should create an adapterFactory', () => {
    const adapterSpy = sinon.spy();
    const fakeIntegrations = [{ name: integrationName, adapter: adapterSpy }];

    const factory = unit.createAdapterFactory(
      integrationName, authSettings, { integrations: fakeIntegrations });

    assert.property(factory, 'create');
    assert.isTrue(adapterSpy.neverCalledWith(network, 'footoken'));
    assert.equal(adapterSpy.callCount, 0);

    adapterSpy.reset();
  });
});
