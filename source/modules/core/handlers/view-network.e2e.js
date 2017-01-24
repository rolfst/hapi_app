import { assert } from 'chai';
import blueprints from '../../../shared/test-utils/blueprints';
import stubs from '../../../shared/test-utils/stubs';
import * as testHelper from '../../../shared/test-utils/helpers';
import { getRequest } from '../../../shared/test-utils/request';

describe('View network', async () => {
  let admin;
  let network1;
  let network2;
  let accessToken;
  const pristineNetwork = stubs.pristine_networks_admins[0];

  before(async () => {
    admin = await testHelper.createUser(blueprints.users.admin);
    const { network } = await testHelper.createNetworkWithIntegration({
      userId: admin.id,
      externalId: pristineNetwork.externalId,
      name: pristineNetwork.name,
      integrationName: pristineNetwork.integrationName,
      integrationToken: 'footoken',
    });
    await testHelper.addUserToNetwork(
        { networkId: network.id, userId: admin.id, roleType: 'ADMIN' });
    network1 = network;
    network2 = await testHelper.createNetwork({ userId: admin.id });
    await testHelper.addUserToNetwork(
        { networkId: network2.id, userId: admin.id, roleType: 'ADMIN' });

    const { tokens } = await testHelper.getLoginToken(blueprints.users.admin);
    accessToken = tokens.access_token;
  });

  after(async () => testHelper.cleanAll());

  it('should return correct has_integration property value', async () => {
    const [integratedNetwork, nonIntegratedNetwork] = await Promise.all([
      getRequest(`/v2/networks/${network1.id}`, accessToken),
      getRequest(`/v2/networks/${network2.id}`, accessToken),
    ]);

    assert.equal(integratedNetwork.result.data.has_integration, true);
    assert.equal(nonIntegratedNetwork.result.data.has_integration, false);
  });

  it('should return correct properties for network object', async () => {
    const { result: { data } } = await getRequest(`/v2/networks/${network1.id}`, accessToken);

    assert.property(data, 'id');
    assert.property(data, 'super_admin');
    assert.property(data, 'has_integration');
    assert.property(data, 'enabled_components');
    assert.property(data, 'created_at');
    assert.isBoolean(data.has_integration);
    assert.isArray(data.enabled_components);
    assert.deepEqual(data.enabled_components, network1.enabledComponents);
    assert.equal(data.type, 'network');
    assert.equal(data.super_admin.id, admin.id);
  });
});
