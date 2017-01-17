import { assert } from 'chai';
import sinon from 'sinon';
import * as userRepository from '../../../core/repositories/user';
import * as networkRepository from '../../../core/repositories/network';
import * as service from '../sync';

describe('Single Network synchronisation', () => {
  const sandbox = sinon.sandbox.create();

  afterEach(() => sandbox.restore());

  it('should fail with error on not adminUser', async () => {
    sandbox.stub(userRepository, 'findUserById').returns(Promise.resolve({ role: 'EMPLOYEE' }));

    const syncAction = service.syncNetworkWithIntegrationPartner(
       { networkId: '43' }, { credentials: { id: 'a' } });

    return assert.isRejected(syncAction,
        /Error: User does not have enough privileges to access this resource/);
  });

  it('should fail with error on not syncable network', async () => {
    sandbox.stub(userRepository, 'findUserById').returns(Promise.resolve({ role: 'ADMIN' }));
    sandbox.stub(userRepository, 'findAllUsers').returns(Promise.resolve([{ role: 'EMPLOYEE' }]));
    sandbox.stub(networkRepository, 'findNetworkById').returns(Promise.resolve(
          { hasIntegration: true, importedAt: null }));

    const syncAction = service.syncNetworkWithIntegrationPartner(
       { networkId: '43' }, { credentials: { id: 'a' } });

    return assert.isRejected(syncAction, /Error: The network has no integration or is not imported yet/);
  });
});
