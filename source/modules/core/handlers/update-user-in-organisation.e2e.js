const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { putRequest } = require('../../../shared/test-utils/request');
const OrganisationService = require('../services/organisation');
const { ERoleTypes } = require('../definitions');
const dateUtils = require('../../../shared/utils/date');

describe('Handler: Update user in organisation', () => {
  let organisation;
  let admin;
  let otherUser;
  let organisationUser;
  let existingFunction;
  let otherFunction;
  let network;

  let updateUrl;
  let updateFixture;

  before(async () => {
    [organisation, admin, organisationUser, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    [existingFunction, otherFunction, network] = await Promise.all([
      testHelpers.createOrganisationFunction(organisation.id, 'old function'),
      testHelpers.createOrganisationFunction(organisation.id, 'other function'),
      testHelpers.createNetwork({ userId: admin.id, organisationId: organisation.id }),
    ]);

    await Promise.all([
      testHelpers.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelpers.addUserToOrganisation(
        organisationUser.id,
        organisation.id,
        ERoleTypes.EMPLOYEE,
        existingFunction.id
      ),
      testHelpers.addUserToNetwork({ networkId: network.id, userId: organisationUser.id }),
    ]);

    updateFixture = {
      role_type: ERoleTypes.ADMIN,
      function_id: otherFunction.id,
      first_name: 'test',
      last_name: 'test',
      email: 'test@test.com',
      password: 'foo',
      date_of_birth: '1980-01-01',
      phone_num: '0102334449',
    };

    updateUrl = `/v2/organisations/${organisation.id}/users/${organisationUser.id}`;
  });

  after(() => testHelpers.cleanAll());

  it('should fail when updating user isn\'t in the organisation', async () => {
    const { statusCode, result } = await putRequest(updateUrl, updateFixture, otherUser.token);

    assert.equal(statusCode, 403);
    assert.equal(result.error_code, '10020');
  });

  it('should fail when user isn\'t an admin in the organisation', async () => {
    const { statusCode, result } = await putRequest(
      updateUrl,
      updateFixture,
      organisationUser.token);

    assert.equal(statusCode, 403);
    assert.equal(result.error_code, '10020');
  });

  it('should update a user in the organisation', async () => {
    const { statusCode, result: { data } } =
      await putRequest(updateUrl, updateFixture, admin.token);

    assert.equal(statusCode, 200, 'Request is successful');

    assert.equal(data.function_id, updateFixture.function_id);
    assert.equal(data.role_type, updateFixture.role_type);
    assert.equal(data.first_name, updateFixture.first_name);
    assert.equal(data.last_name, updateFixture.last_name);
    assert.equal(data.email, updateFixture.email);
    assert.equal(data.date_of_birth, dateUtils.toISOString(updateFixture.date_of_birth));
    assert.equal(data.phone_num, updateFixture.phone_num);

    const actual = await OrganisationService.getUser({
      userId: organisationUser.id,
      organisationId: organisation.id,
    }, { credentials: admin });

    assert.equal(actual.functionId, updateFixture.function_id);
    assert.equal(actual.roleType, updateFixture.role_type);
    assert.equal(actual.firstName, updateFixture.first_name);
    assert.equal(actual.lastName, updateFixture.last_name);
    assert.equal(actual.email, updateFixture.email);
    assert.equal(actual.dateOfBirth, dateUtils.toISOString(updateFixture.date_of_birth));
    assert.equal(actual.phoneNum, updateFixture.phone_num);
  });
});
