const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { putRequest } = require('../../../shared/test-utils/request');
const OrganisationRepo = require('../repositories/organisation');

describe('Handler: Update function for user', () => {
  let organisation;
  let admin;
  let otherUser;
  let organisationUser;
  let existingFunction;
  let otherFunction;
  let network;

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
      testHelpers.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelpers.addUserToOrganisation(organisationUser.id, organisation.id),
    ]);
    await testHelpers.addUserToNetwork({ networkId: network.id, userId: organisationUser.id });
    await Promise.all([
      OrganisationRepo.updateUser(organisationUser.id, organisation.id,
        { functionId: existingFunction.id }),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should update a function', async () => {
    const initialUser = await OrganisationRepo.getPivot(organisationUser.id, organisation.id);

    const endpoint = `/v2/networks/${network.id}/users/${organisationUser.id}`;
    const { statusCode } = await putRequest(endpoint, {
      functionId: otherFunction.id,
      organisationId: organisation.id,
    }, admin.token);

    assert.equal(statusCode, 200, 'Request is successful');

    const actual = await OrganisationRepo.getPivot(organisationUser.id, organisation.id);

    assert.equal(initialUser.functionId, existingFunction.id, 'Function is updated');
    assert.equal(actual.functionId, otherFunction.id, 'Function is updated');
  });

  it('should fail when user isn\'t an admin in the organisation', async () => {
    const endpoint = `/v2/networks/${network.id}/users/${organisationUser.id}`;
    const { statusCode, result } = await putRequest(endpoint,
      {
        functionId: existingFunction.id,
        organisationId: organisation.id,
      }, organisationUser.token);

    assert.equal(statusCode, 403);
    assert.equal(result.error_code, '10020');
  });

  it('should fail when user isn\'t in the organisation', async () => {
    const endpoint = `/v2/networks/${network.id}/users/${otherUser.id}`;
    const { statusCode, result } = await putRequest(endpoint,
      {
        functionId: otherFunction.id,
        organisationId: organisation.id,
      }, admin.token);

    assert.equal(statusCode, 403);
    assert.equal(result.error_code, '403');
  });
});
