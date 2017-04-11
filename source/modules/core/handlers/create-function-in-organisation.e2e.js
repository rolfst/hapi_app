const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');

describe('Handler: Create functions in organisation', () => {
  let organisation;
  let admin;
  let otherUser;
  let organisationUser;
  const newFunctionName = 'new function';

  before(async () => {
    [organisation, admin, organisationUser, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    await Promise.all([
      testHelpers.addUserToOrganisation(organisationUser.id, organisation.id),
      testHelpers.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelpers.createNetwork({ userId: admin.id, organisationId: organisation.id }),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should add a function', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions`;
    const { statusCode, result } = await postRequest(endpoint, {
      name: newFunctionName,
    }, admin.token);

    assert.equal(statusCode, 200, 'Request is successful');
    assert.property(result.data, 'id', 'Result contains new id');
    assert.equal(result.data.organisation_id, organisation.id, 'Organisation id is correct');
    assert.equal(result.data.name, newFunctionName, 'Function has correct name');
  });

  it('should fail when user isn\'t an admin in the organisation', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions`;
    const { statusCode } = await postRequest(endpoint, { name: 'shouldn\'t exist' }, organisationUser.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when user isn\'t in the organisation', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions`;
    const { statusCode } = await postRequest(endpoint, { name: 'shouldn\'t exist' }, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
