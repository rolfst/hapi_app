const { assert } = require('chai');
const { find } = require('lodash');
const testHelper = require('../../../shared/test-utils/helpers');
const blueprints = require('../../../shared/test-utils/blueprints');
const stubs = require('../../../shared/test-utils/stubs');
const { getRequest } = require('../../../shared/test-utils/request');

describe('Networks for logged user', async () => {
  let requestResult;
  let network1;
  let network2;
  const pristineNetwork = stubs.pristine_networks_admins[0];

  before(async () => {
    const admin = await testHelper.createUser(blueprints.users.admin);
    const { network } = await testHelper.createNetworkWithIntegration({
      userId: admin.id,
      externalId: pristineNetwork.externalId,
      name: pristineNetwork.name,
      integrationName: pristineNetwork.integrationName,
      token: 'footoken',
    });

    await testHelper.addUserToNetwork(
        { networkId: network.id, userId: admin.id, roleType: 'ADMIN' });
    network1 = network;
    network2 = await testHelper.createNetwork({ userId: admin.id });
    await testHelper.addUserToNetwork(
        { networkId: network2.id, userId: admin.id, roleType: 'ADMIN' });

    const { tokens } = await testHelper.getLoginToken(blueprints.users.admin);
    const accessToken = tokens.access_token;
    const { result } = await getRequest('/v2/users/me/networks', accessToken);
    requestResult = result;
  });

  after(() => testHelper.cleanAll());

  it('should return correct network amount', async () => {
    assert.equal(requestResult.data.length, 2);
  });

  it('enabled_components property should return as array', () => {
    assert.isArray(requestResult.data[0].enabled_components);
  });

  it('should return correct has_integration property value', () => {
    const integratedNetwork = find(requestResult.data, { id: network1.id.toString() });
    const nonIntegratedNetwork = find(requestResult.data, { id: network2.id.toString() });

    assert.isTrue(integratedNetwork.has_integration);
    assert.isFalse(nonIntegratedNetwork.has_integration);
  });

  it('should return correct properties for network object', () => {
    assert.property(requestResult.data[0], 'id');
    assert.property(requestResult.data[0], 'name');
    assert.property(requestResult.data[0], 'enabled_components');
    assert.property(requestResult.data[0], 'has_integration');
    assert.property(requestResult.data[0], 'created_at');
  });
});
