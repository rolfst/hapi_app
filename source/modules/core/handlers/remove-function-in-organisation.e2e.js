const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { deleteRequest } = require('../../../shared/test-utils/request');
const organisationRepo = require('../repositories/organisation');

describe('Handler: Delete functions in organisation', () => {
  let organisation;
  let admin;
  let otherUser;
  let organisationUser;
  let existingFunction;

  before(async () => {
    [organisation, admin, organisationUser, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    [existingFunction] = await Promise.all([
      testHelpers.createOrganisationFunction(organisation.id, 'existing function'),
      organisationRepo.addUser(admin.id, organisation.id, 'ADMIN'),
      organisationRepo.addUser(organisationUser.id, organisation.id, 'EMPLOYEE'),
      testHelpers.createNetwork({ userId: admin.id, organisationId: organisation.id }),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should delete a function', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions/${existingFunction.id}`;
    const { statusCode } = await deleteRequest(endpoint, null, admin.token);

    assert.equal(statusCode, 200, 'Request is successful');

    const verifyFunction = await organisationRepo.findFunction(existingFunction.id);

    assert.isNull(verifyFunction, 'Function should be gone');
  });

  it('should fail when user isn\'t an admin in the organisation', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions/${existingFunction.id}`;
    const { statusCode } = await deleteRequest(endpoint, null, organisationUser.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when user isn\'t in the organisation', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions/${existingFunction.id}`;
    const { statusCode } = await deleteRequest(endpoint, null, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
