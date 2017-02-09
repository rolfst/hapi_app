import { assert } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import * as testHelper from '../../../shared/test-utils/helpers';
import { getRequest } from '../../../shared/test-utils/request';
import stubs from '../../../shared/test-utils/stubs';

describe('Handler: List admins from network', () => {
  let network;
  const pristineNetwork = stubs.pristine_networks_admins[0];

  describe('Happy path', async () => {
    const sandbox = sinon.sandbox.create();
    const admin = await testHelper.createUser({ password: 'foo' });

    before(async () => {
      nock(pristineNetwork.externalId)
        .get('/users')
        .reply(200, stubs.users_200);

      const { network: result } = await testHelper.createNetworkWithIntegration({
        userId: admin.id,
        name: 'flexappeal',
        integrationName: 'PMT',
        integrationToken: 'foobar',
        userExternalId: '8023',
        userToken: '379ce9b4176cb89354c1f74b3a2c1c7a',
        externalId: pristineNetwork.externalId,
      });
      network = result;
    });

    after(async () => {
      sandbox.restore();

      return testHelper.cleanAll();
    });

    it('should succeed', async () => {
      const endpoint = `/v2/networks/${network.id}/integration/admins`;
      const response = await getRequest(endpoint, 'foobar');

      assert.equal(response.statusCode, 200);
      assert.equal(response.result.data.length, 0);
    });
  });

  describe('Fault path', async () => {
    const sandbox = sinon.sandbox.create();

    before(async () => {
      nock(pristineNetwork.externalId)
        .get('/users')
        .reply(200, stubs.users_200);

      const admin = await testHelper.createUser({ password: 'foo' });
      network = await testHelper.createNetworkWithIntegration({
        userId: admin.id,
        externalId: pristineNetwork.externalId,
        integrationToken: 'foobar',
        name: pristineNetwork.name,
      });
    });

    after(async () => {
      sandbox.restore();

      return testHelper.cleanAll();
    });

    it('should fail on missing network', async () => {
      const endpoint = '/v2/networks/-1/integration/admins';
      const res = await getRequest(endpoint, 'foobar');

      assert.equal(res.statusCode, 404);
    });
  });
});
