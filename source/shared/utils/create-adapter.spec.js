import { assert } from 'chai';
import sinon from 'sinon';
import * as userRepo from '../../modules/core/repositories/user';
import * as unit from './create-adapter';

describe('createAdapter', () => {
  const integrationName = 'foo';
  const userId = '1';
  const network = {
    id: '1',
    name: 'My network',
    externalId: 'http://foo.api.com',
    hasIntegration: true,
    integrations: [integrationName],
  };

  const fakeAdapter = () => ({ foo: 'baz' });
  const fakeIntegrations = [{ name: 'foo', adapter: fakeAdapter }];

  beforeEach(() => {
    sinon.stub(userRepo, 'findNetworkLink').returns(Promise.resolve({
      userToken: 'footoken',
    }));
  });

  afterEach(() => userRepo.findNetworkLink.restore());

  it('should pass network and token to adapter', async () => {
    const adapterSpy = sinon.spy();
    const _fakeIntegrations = [{ name: 'foo', adapter: adapterSpy }];

    await unit.createAdapter(network, userId, { integrations: _fakeIntegrations });

    assert.isTrue(adapterSpy.calledWith(network, 'footoken'));
    assert.isTrue(adapterSpy.calledOnce);

    adapterSpy.reset();
  });

  it('should return the adapter', async () => {
    const actual = await unit.createAdapter(network, userId, { integrations: fakeIntegrations });

    assert.deepEqual(actual, { foo: 'baz' });
  });

  it('should proceed when proceedWithoutToken is set to true', async () => {
    userRepo.findNetworkLink.restore();
    sinon.stub(userRepo, 'findNetworkLink').returns(Promise.resolve({
      userToken: null,
    }));

    const actual = await unit.createAdapter(network, userId, {
      proceedWithoutToken: true,
      integrations: fakeIntegrations,
    });

    assert.deepEqual(actual, { foo: 'baz' });
  });

  it('should fail when there is no adapter for integration for network', () => {
    const promise = unit.createAdapter(network, userId, { integrations: {} });

    return assert.isRejected(promise, /Couldn\'t find integration with adapter./);
  });

  it('should fail when the network has no externalId value', () => {
    const networkWithoutExternalId = { ...network, externalId: null };
    const promise = unit.createAdapter(networkWithoutExternalId, userId, { integrations: {} });

    return assert.isRejected(promise, /Network has no externalId value./);
  });

  it('should fail when network has no integration', () => {
    const networkWithoutIntegration = { ...network, hasIntegration: false };
    const promise = unit.createAdapter(networkWithoutIntegration, userId, {
      integrations: { fakeIntegrations } });

    return assert.isRejected(promise, /The network doesn\'t have a linked integration./);
  });

  it('should fail when no token found', () => {
    userRepo.findNetworkLink.restore();
    sinon.stub(userRepo, 'findNetworkLink').returns(Promise.resolve({
      userToken: null,
    }));

    const promise = unit.createAdapter(network, userId, { integrations: fakeIntegrations });

    return assert.isRejected(promise, /User not authenticated with integration./);
  });
});
