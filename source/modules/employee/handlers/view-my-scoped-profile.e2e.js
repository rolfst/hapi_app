const { assert } = require('chai');
const moment = require('moment');
const R = require('ramda');
const dateUtils = require('../../../shared/utils/date');
const testHelpers = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');
const organisationRepo = require('../../core/repositories/organisation');

describe('Handler: View my scoped profile', () => {
  let employee;
  let admin;
  let organisationA;
  let organisationB;
  let network;
  let networkWithIntegration;
  let currentDate;

  before(async () => {
    [organisationA, organisationB, admin, employee] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    [network, networkWithIntegration] = await Promise.all([
      testHelpers.createNetwork({ userId: admin.id }),
      testHelpers.createNetworkWithIntegration({
        userToken: 'foo', userExternalId: '341', userId: admin.id }),
    ]);

    await Promise.all([
      organisationRepo.addUser(admin.id, organisationA.id, 'ADMIN'),
      organisationRepo.addUser(admin.id, organisationB.id),
      organisationRepo.addUser(employee.id, organisationA.id),
      testHelpers.addUserToNetwork({
        userId: employee.id, networkId: network.id, roleType: 'EMPLOYEE' }),
      testHelpers.addUserToNetwork({
        userId: employee.id, networkId: networkWithIntegration.network.id, roleType: 'EMPLOYEE' }),
      testHelpers.addUserToNetwork({
        userId: admin.id, networkId: network.id, roleType: 'ADMIN' }),
    ]);

    currentDate = moment().millisecond(0).toDate();
    await Promise.all([
      organisationRepo.updateUser(admin.id, organisationA.id, { invitedAt: currentDate }),
      organisationRepo.updateUser(employee.id, organisationA.id, { invitedAt: currentDate }),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should return correct user object', async () => {
    const endpoint = '/v2/users/me';
    const { result: { data } } = await getRequest(endpoint, admin.token);

    assert.equal(data.id, admin.id);
    assert.equal(data.username, admin.username);
    assert.equal(data.first_name, admin.firstName);
    assert.equal(data.last_name, admin.lastName);
    assert.equal(data.full_name, admin.fullName);
    assert.equal(data.phone_num, admin.phoneNum);
    assert.equal(data.email, admin.email);
    assert.equal(data.date_of_birth, admin.dateOfBirth);
    assert.property(data, 'created_at');
    assert.property(data, 'updated_at');
    assert.property(data, 'scopes');
    assert.isArray(data.scopes.organisations);
    const organisation = R.head(data.scopes.organisations);
    assert.isDefined(organisation);
    assert.property(organisation, 'id');
    assert.property(organisation, 'name');
    assert.property(organisation, 'brand_icon');
    assert.property(organisation, 'role_type');
    assert.property(organisation, 'invited_at');
    assert.equal(organisation.invited_at, dateUtils.toISOString(currentDate));
    assert.property(organisation, 'deleted_at');
    assert.isArray(data.scopes.networks);
    const aNetwork = R.head(data.scopes.networks);
    assert.isDefined(aNetwork);
    assert.property(aNetwork, 'id');
    assert.property(aNetwork, 'name');
    assert.property(aNetwork, 'organisation_id');
    assert.property(aNetwork, 'role_type');
    assert.property(aNetwork, 'invited_at');
    assert.property(aNetwork, 'deleted_at');
    assert.property(aNetwork, 'integration_auth');

    // TODO these fields are not in spec but are in the database
    // assert.equal(data.address, admin.address);
    // assert.equal(data.zipCode, admin.zipCode);
  });

  it('should return correct user object for network without integration', async () => {
    const endpoint = '/v2/users/me';
    const { result: { data } } = await getRequest(endpoint, admin.token);

    assert.equal(data.id, admin.id);
    assert.equal(data.username, admin.username);
    assert.equal(data.first_name, admin.firstName);
    assert.equal(data.last_name, admin.lastName);
    assert.equal(data.phone_num, admin.phoneNum);
    assert.equal(data.email, admin.email);
    assert.equal(data.date_of_birth, admin.dateOfBirth);
    assert.property(data, 'created_at');
    assert.property(data, 'updated_at');
  });

  it('should return correct user object for network with integration', async () => {
    const endpoint = '/v2/users/me';
    const { result: { data } } = await getRequest(endpoint, admin.token);

    assert.equal(data.id, admin.id);
    assert.equal(data.username, admin.username);
    assert.equal(data.first_name, admin.firstName);
    assert.equal(data.last_name, admin.lastName);
    assert.equal(data.phone_num, admin.phoneNum);
    assert.equal(data.email, admin.email);
    assert.equal(data.date_of_birth, admin.dateOfBirth);
    assert.property(data, 'created_at');
    assert.property(data, 'updated_at');
  });
});
