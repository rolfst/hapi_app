import { assert } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import { getRequest } from '../../../shared/test-utils/request';
import stubs from '../../../shared/test-utils/stubs';
import * as networkRepo from '../repositories/network';
import * as integrationRepo from '../repositories/integration';

describe('List admins from network', () => {
  let network;
  let response;
  const pristineNetwork = stubs.pristine_networks_admins[0];

  describe('Happy path', async () => {
    let integration;
    let sandbox;

    before(async () => {
      sandbox = sinon.sandbox.create();
      nock(pristineNetwork.externalId)
        .get('/users')
        .reply(200, stubs.users_200);

      integration = await integrationRepo.createIntegration({
        name: pristineNetwork.integrationName,
        token: 'footoken',
      });

      network = await networkRepo.createIntegrationNetwork({
        userId: global.users.admin.id,
        externalId: pristineNetwork.externalId,
        name: pristineNetwork.name,
        integrationName: pristineNetwork.integrationName,
      });

      const endpoint = `/v2/networks/${network.id}/integration/admins`;
      response = await getRequest(endpoint, global.server, 'footoken');
    });

    after(async () => {
      network = await networkRepo.findNetwork({
        externalId: pristineNetwork.externalId,
        name: pristineNetwork.name,
      });

      sandbox.restore();

      await integration.destroy();
      await networkRepo.deleteById(network.id);
    });

    it('should succeed', async () => {
      assert.equal(response.statusCode, 200);
      assert.equal(response.result.data.length, 0);
    });
  });

  describe('Fault path', async () => {
    it('should fail on missing network', async () => {
      const endpoint = '/v2/networks/-1/integration/admins';
      const res = await getRequest(endpoint, global.server, 'footoken');

      assert.equal(res.statusCode, 404);
    });
  });
});
