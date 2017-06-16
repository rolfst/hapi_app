const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const User = require('./user-cache');
const { ERoleTypes } = require('../../authorization/definitions');

describe('User cache', () => {
  let admin;
  let organisationAdmin;
  let employee;
  let organisation;
  let network;

  before(async () => {
    [admin, organisationAdmin, employee, organisation] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createOrganisation(),
    ]);

    [network] = await Promise.all([
      testHelper.createNetwork({ organisationId: organisation.id, userId: admin.id }),
      testHelper.addUserToOrganisation(organisationAdmin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
    ]);

    await testHelper.addUserToNetwork({ networkId: network.id, userId: employee.id });
  });

  after(() => testHelper.cleanAll());

  it('should fetch a complete user with scopes and cache the object for performance', async () => {
    const newStart = new Date();
    const newlyCachedUser = await User.get(admin.id);
    const newStop = new Date();

    const cachedStart = new Date();
    const cachedUser = await User.get(admin.id);
    const cachedStop = new Date();

    assert.isObject(newlyCachedUser);
    assert.isObject(cachedUser);

    assert.property(newlyCachedUser, 'id');
    assert.property(newlyCachedUser, 'username');
    assert.property(newlyCachedUser, 'scopes');
    assert.isObject(newlyCachedUser.scopes.organisations);
    assert.isObject(newlyCachedUser.scopes.networks);
    assert.isObject(newlyCachedUser.scopes.teams);

    const firstOrganisation = newlyCachedUser.scopes.organisations[organisation.id];
    assert.property(firstOrganisation, 'id');
    assert.property(firstOrganisation, 'roleType');

    const firstNetwork = newlyCachedUser.scopes.networks[network.id];
    assert.property(firstNetwork, 'id');
    assert.property(firstNetwork, 'organisationId');
    assert.property(firstNetwork, 'roleType');

    assert.deepEqual(newlyCachedUser, cachedUser);
    assert.isBelow(cachedStop - cachedStart, newStop - newStart, 'cache should have sped up a subsequent call');
  });

  it('should make organisation admins automatic network admins regardless of their network link', async () => {
    const organisationAdminNotNetworkMember = await User.get(organisationAdmin.id);

    assert(organisationAdminNotNetworkMember.hasRoleInNetwork(network.id, ERoleTypes.ADMIN));
  });
});
