const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');

describe('Handler: Functions in organisation', () => {
  let organisation;
  let admin;
  let otherUser;
  let createdFunction1;

  before(async () => {
    [organisation, admin, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    [,, createdFunction1] = await Promise.all([
      testHelpers.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelpers.createNetwork({ userId: admin.id, organisationId: organisation.id }),
      testHelpers.createOrganisationFunction(organisation.id, 'really important function'),
      testHelpers.createOrganisationFunction(organisation.id, 'coffee machine'),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should return all functions', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions`;
    const { result } = await getRequest(endpoint, admin.token);

    assert.lengthOf(result.data, 2);
    assert.equal(result.data[0].id, createdFunction1.id, 'Id is the correct');
    assert.equal(result.data[0].name, createdFunction1.name, 'Name is correct');
    assert.equal(result.data[0].created_at, createdFunction1.createdAt, 'createdAt is the same');
  });

  it('should fail when user doesnt belong to the organisation', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions`;
    const { statusCode } = await getRequest(endpoint, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
