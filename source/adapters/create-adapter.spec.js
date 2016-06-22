import { assert } from 'chai';
import sinon from 'sinon';
import IntegrationNotFound from 'common/errors/integration-not-found';
import * as unit from 'adapters/create-adapter';

describe('createAdapter', () => {
  const network = { name: 'My network', Integrations: [{ id: 1 }] };
  const authSettings = [{ name: 'foo', token: 'footoken' }];

  it('should pass token to the adapter', () => {
    const adapterSpy = sinon.spy();
    const fakeIntegrations = {
      1: { name: 'foo', adapter: adapterSpy },
    };

    unit.default(network, authSettings, fakeIntegrations);

    assert(adapterSpy.calledWith('footoken'));
    assert(adapterSpy.calledOnce);

    adapterSpy.reset();
  });

  it('should return the adapter', () => {
    const fakeAdapter = () => ({ foo: 'baz' });
    const fakeIntegrations = {
      1: { name: 'foo', adapter: fakeAdapter },
    };

    const actual = unit.default(network, authSettings, fakeIntegrations);

    assert.deepEqual(actual, { foo: 'baz' });
  });

  it('should fail when no adapter found', () => {
    const actual = () => unit.default(network, authSettings, {});

    assert.throws(actual, IntegrationNotFound);
  });
});
