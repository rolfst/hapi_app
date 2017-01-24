import { assert } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import * as testHelper from '../../../shared/test-utils/helpers';
import { getRequest } from '../../../shared/test-utils/request';
import stubs from '../../../shared/test-utils/stubs';
import * as networkRepo from '../repositories/network';

describe('Handler: List admins from network', () => {
  let network;
  const pristineNetwork = stubs.pristine_networks_admins[0];

  describe('Happy path', async () => {
    let sandbox;

    before(async () => {
      sandbox = sinon.sandbox.create();
      nock(pristineNetwork.externalId)
        .get('/users')
        .reply(200, stubs.users_200);

      const admin = await testHelper.createUser();
      const { network: result } = await testHelper.createNetworkWithIntegration({
        userId: admin.id,
        externalId: pristineNetwork.externalId,
        name: pristineNetwork.name,
        integrationName: pristineNetwork.integrationName,
        token: 'footoken',
      });
      network = result;
    });

    after(async () => {
      network = await networkRepo.findNetwork({
        externalId: pristineNetwork.externalId,
        name: pristineNetwork.name,
      });

      sandbox.restore();

      return testHelper.cleanAll();
    });

    it('should succeed', async () => {
      const endpoint = `/v2/networks/${network.id}/integration/admins`;
      const response = await getRequest(endpoint, 'footoken');

      assert.equal(response.statusCode, 200);
      assert.equal(response.result.data.length, 0);
    });
  });

  describe('Fault path', async () => {
    let sandbox;

    before(async () => {
      sandbox = sinon.sandbox.create();
      nock(pristineNetwork.externalId)
        .get('/users')
        .reply(200, stubs.users_200);

      const admin = await testHelper.createUser();
      network = await testHelper.createNetworkWithIntegration({
        userId: admin.id,
        externalId: pristineNetwork.externalId,
        name: pristineNetwork.name,
        integrationName: pristineNetwork.integrationName,
        token: 'footoken',
      });
    });

    after(async () => {
      network = await networkRepo.findNetwork({
        externalId: pristineNetwork.externalId,
        name: pristineNetwork.name,
      });

      sandbox.restore();

      return testHelper.cleanAll();
    });
    it('should fail on missing network', async () => {
      const endpoint = '/v2/networks/-1/integration/admins';
      const res = await getRequest(endpoint, 'footoken');

      assert.equal(res.statusCode, 404);
    });
  });
});
