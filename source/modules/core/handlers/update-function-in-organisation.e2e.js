const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { putRequest } = require('../../../shared/test-utils/request');
const organisationRepo = require('../repositories/organisation');

describe('Handler: Update functions in organisation', () => {
  let organisation;
  let admin;
  let otherUser;
  let organisationUser;
  let existingFunction;
  const newFunctionName = 'new function';

  before(async () => {
    [organisation, admin, organisationUser, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    [existingFunction] = await Promise.all([
      testHelpers.createOrganisationFunction(organisation.id, 'old function'),
      organisationRepo.addUser(admin.id, organisation.id, 'ADMIN'),
      organisationRepo.addUser(organisationUser.id, organisation.id, 'EMPLOYEE'),
      testHelpers.createNetwork({ userId: admin.id, organisationId: organisation.id }),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should update a function', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions/${existingFunction.id}`;
    const { statusCode } = await putRequest(endpoint, {
      name: newFunctionName,
    }, admin.token);

    assert.equal(statusCode, 200, 'Request is successful');

    const verifyFunction = await organisationRepo.findFunction(existingFunction.id);

    assert.equal(verifyFunction.name, newFunctionName, 'Function name is updated');
  });

  it('should fail when user isn\'t an admin in the organisation', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions/${existingFunction.id}`;
    const { statusCode } = await putRequest(endpoint, { name: 'shouldn\'t be updated' }, organisationUser.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when user isn\'t in the organisation', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/functions/${existingFunction.id}`;
    const { statusCode } = await putRequest(endpoint, { name: 'shouldn\'t be updated' }, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
