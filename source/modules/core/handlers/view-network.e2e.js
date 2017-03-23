const { assert } = require('chai');
const blueprints = require('../../../shared/test-utils/blueprints');
const stubs = require('../../../shared/test-utils/stubs');
const testHelper = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');

describe('View network', async () => {
  let admin;
  let network1;
  let network2;
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
    network1 = network;
    network2 = await testHelper.createNetwork({ userId: admin.id });
  });

  after(() => testHelper.cleanAll());

  it('should return correct has_integration property value', async () => {
    const [integratedNetwork, nonIntegratedNetwork] = await Promise.all([
      getRequest(`/v2/networks/${network1.id}`, admin.token),
      getRequest(`/v2/networks/${network2.id}`, admin.token),
    ]);

    assert.equal(integratedNetwork.result.data.has_integration, true);
    assert.equal(nonIntegratedNetwork.result.data.has_integration, false);
  });

  it('should return correct properties for network object', async () => {
    const { result: { data } } = await getRequest(`/v2/networks/${network1.id}`, admin.token);

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
