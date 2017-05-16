const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { putRequest } = require('../../../shared/test-utils/request');
const UserService = require('../services/user');
const { ERoleTypes } = require('../definitions');
const dateUtils = require('../../../shared/utils/date');

describe.only('Handler: Update user in organisation', () => {
  let organisation;
  let admin;
  let otherAdmin;
  let organisationUser;
  let otherUser;
  let network;
  let networkAdmin;

  let updateUrl;
  let updateFixture;

  before(async () => {
    [organisation, admin, otherAdmin, organisationUser, networkAdmin, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
      testHelpers.createUser(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    network =
      await testHelpers.createNetwork({ userId: admin.id, organisationId: organisation.id });

    await Promise.all([
      testHelpers.addUserToOrganisation(admin.id, organisation.id, ERoleTypes.ADMIN),
      testHelpers.addUserToOrganisation(otherAdmin.id, organisation.id, ERoleTypes.ADMIN),
      testHelpers.addUserToOrganisation(
        organisationUser.id,
        organisation.id,
        ERoleTypes.EMPLOYEE
      ),
      testHelpers.addUserToOrganisation(
        networkAdmin.id,
        organisation.id,
        ERoleTypes.EMPLOYEE
      ),
      testHelpers.addUserToNetwork({ networkId: network.id, userId: organisationUser.id }),
      testHelpers.addUserToNetwork({
        networkId: network.id,
        userId: networkAdmin.id,
        roleType: ERoleTypes.ADMIN
      }),
    ]);

    updateFixture = {
      role_type: ERoleTypes.ADMIN,
      first_name: 'test',
      last_name: 'test',
      email: 'test@test.com',
      password: 'foo',
      date_of_birth: '1980-01-01',
      phone_num: '0102334449',
    };

    updateUrl = `/v2/networks/${network.id}/users/${organisationUser.id}`;
  });

  after(() => testHelpers.cleanAll());

  it('should fail when user isn\'t in the organisation', async () => {
    const { statusCode } = await putRequest(updateUrl, updateFixture, otherUser.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when user isn\'t an admin in the organisation or the network', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      updateFixture,
      organisationUser.token);

    assert.equal(statusCode, 403);
  });

  it('should update a user in the organisation for network admin', async () => {
    const { statusCode, result: { data } } =
      await putRequest(updateUrl, updateFixture, admin.token);

    assert.equal(statusCode, 200, 'Request is successful');

    assert.equal(data.role_type, updateFixture.role_type);
    assert.equal(data.first_name, updateFixture.first_name);
    assert.equal(data.last_name, updateFixture.last_name);
    assert.equal(data.email, updateFixture.email);
    assert.equal(data.date_of_birth, dateUtils.toISOString(updateFixture.date_of_birth));
    assert.equal(data.phone_num, updateFixture.phone_num);

    const actual = await UserService.getUserWithNetworkScope({
      id: organisationUser.id,
      networkId: network.id,
    }, { credentials: networkAdmin });

    assert.equal(actual.roleType, updateFixture.role_type);
    assert.equal(actual.firstName, updateFixture.first_name);
    assert.equal(actual.lastName, updateFixture.last_name);
    assert.equal(actual.email, updateFixture.email);
    assert.equal(actual.dateOfBirth, dateUtils.toISOString(updateFixture.date_of_birth));
    assert.equal(actual.phoneNum, updateFixture.phone_num);
  });

  it('should update user for an organisation admin thats not a network admin', async () => {
    const { statusCode } = await putRequest(updateUrl, updateFixture, networkAdmin.token);

    assert.equal(statusCode, 200, 'Request is successful');
  });

  it('should update user for an organisation admin thats not in the network', async () => {
    const { statusCode } = await putRequest(updateUrl, updateFixture, otherAdmin.token);

    assert.equal(statusCode, 200, 'Request is successful');
  });
});
