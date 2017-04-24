const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');

describe('Handler: View user in organisation', () => {
  let organisation;
  let admin;
  let otherUser;
  let organisationUser;
  let network;

  let fetchUrl;

  before(async () => {
    [organisation, admin, organisationUser, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    network = await testHelpers
      .createNetwork({ userId: admin.id, organisationId: organisation.id });

    await Promise.all([
      testHelpers.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelpers.addUserToOrganisation(organisationUser.id, organisation.id),
      testHelpers.addUserToNetwork({ networkId: network.id, userId: organisationUser.id }),
    ]);

    fetchUrl = `/v2/organisations/${organisation.id}/users/${organisationUser.id}`;
  });

  after(() => testHelpers.cleanAll());

  it('should fail when user isn\'t in the organisation', async () => {
    const { statusCode, result } = await getRequest(fetchUrl, otherUser.token);

    assert.equal(statusCode, 403);
    assert.equal(result.error_code, '403');
  });

  it('should fail when user isn\'t an admin in the organisation', async () => {
    const { statusCode, result } = await getRequest(fetchUrl, organisationUser.token);

    assert.equal(statusCode, 403);
    assert.equal(result.error_code, '10020');
  });

  it('should return a user in the organisation with all properties', async () => {
    const { statusCode, result: { data } } = await getRequest(fetchUrl, admin.token);

    assert.equal(statusCode, 200, 'Request is successful');

    assert.property(data, 'first_name');
    assert.property(data, 'last_name');
    assert.property(data, 'full_name');
    assert.property(data, 'phone_num');
    assert.property(data, 'type');
    assert.property(data, 'id');
    assert.property(data, 'username');
    assert.property(data, 'email');
    assert.property(data, 'external_id');
    assert.property(data, 'integration_auth');
    assert.property(data, 'function');
    assert.property(data, 'role_type');
    assert.property(data, 'team_ids');
    assert.property(data, 'profile_img');
    assert.property(data, 'date_of_birth');
    assert.property(data, 'created_at');
    assert.property(data, 'last_login');
    assert.property(data, 'invited_at');
    assert.property(data, 'deleted_at');
    assert.property(data, 'function_id');
  });
});
