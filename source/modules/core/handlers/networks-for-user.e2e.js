const { assert } = require('chai');
const { find } = require('lodash');
const testHelper = require('../../../shared/test-utils/helpers');
const blueprints = require('../../../shared/test-utils/blueprints');
const stubs = require('../../../shared/test-utils/stubs');
const { getRequest } = require('../../../shared/test-utils/request');
const { ERoleTypes } = require('../../authorization/definitions');

describe('Networks for logged user', async () => {
  let requestResult;
  let network1;
  let network2;
  const pristineNetwork = stubs.pristine_networks_admins[0];

  before(async () => {
    const admin = await testHelper.createUser(blueprints.users.admin);

    const networkWithIntegration = await testHelper.createNetworkWithIntegration({
      userId: admin.id,
      externalId: pristineNetwork.externalId,
      name: pristineNetwork.name,
      integrationName: pristineNetwork.integrationName,
      token: 'footoken',
    });

    network1 = networkWithIntegration.network;
    network2 = await testHelper.createNetwork({ userId: admin.id });

    await testHelper.addUserToNetwork({
      networkId: network1.id, userId: admin.id, roleType: 'ADMIN',
    });

    await testHelper.addUserToNetwork({
      networkId: network2.id, userId: admin.id, roleType: 'ADMIN',
    });

    const { tokens } = await testHelper.getLoginToken(blueprints.users.admin);
    const { result } = await getRequest('/v2/users/me/networks', tokens.access_token);
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

  describe('Case when arganisation admin', () => {
    let admin;

    before(async () => {
      const organisation = await testHelper.createOrganisation();
      admin = await testHelper.createUser();
      const otherAdmin = await testHelper.createUser();

      const [firstNetwork] = await Promise.all([
        testHelper.createNetwork({ userId: otherAdmin.id, organisationId: organisation.id }),
        testHelper.createNetwork({ userId: otherAdmin.id, organisationId: organisation.id }),
        testHelper.createNetwork({ userId: otherAdmin.id, organisationId: organisation.id }),
      ]);

      await Promise.all([
        testHelper.addUserToOrganisation(admin.id, organisation.id, ERoleTypes.ADMIN),
        testHelper.addUserToOrganisation(otherAdmin.id, organisation.id, ERoleTypes.ADMIN),
        testHelper.addUserToNetwork({ networkId: firstNetwork.id, userId: admin.id }),
      ]);
    });

    it('should return all networks when user is admin in organisation', async () => {
      const { result } = await getRequest('/v2/users/me/networks', admin.token);

      assert.equal(result.data.length, 3);
    });
  });
});
