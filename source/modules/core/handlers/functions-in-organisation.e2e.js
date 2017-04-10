const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');

describe.only('Handler: Functions in organisation', () => {
  let organisation;
  let admin;
  let otherUser;

  before(async () => {
    [organisation, admin, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    await Promise.all([
      testHelpers.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelpers.createNetwork({ userId: admin.id, organisationId: organisation.id, }),
      testHelpers.createOrganisationFunction(organisation.id, 'really important function'),
      testHelpers.createOrganisationFunction(organisation.id, 'coffee machine'),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should return all functions', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions`;
    const { result } = await getRequest(endpoint, admin.token);

    assert.lengthOf(result.data, 2);
  });

  it('should fail when user doesnt belong to the organisation', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions`;
    const { statusCode } = await getRequest(endpoint, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
