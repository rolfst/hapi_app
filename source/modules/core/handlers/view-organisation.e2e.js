const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');
const OrganisationRepo = require('../repositories/organisation');

describe('Handler: View organisation', async () => {
  let organisation;
  let admin;
  let notAnEmployee;

  before(async () => {
    [organisation, admin, notAnEmployee] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    const [existingFunction] = await Promise.all([
      testHelpers.createOrganisationFunction(organisation.id, 'old function'),
      testHelpers.createNetwork({ userId: admin.id, organisationId: organisation.id }),
      testHelpers.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
    ]);
    await OrganisationRepo.updateUser(
      admin.id, organisation.id, { functionId: existingFunction.id });
  });

  after(() => testHelpers.cleanAll());

  it('should return correct organisation', async () => {
    const { statusCode, result } = await getRequest(`/v2/organisations/${organisation.id}`, admin.token);

    assert.equal(statusCode, 200);
    assert.property(result.data, 'id');
    assert.property(result.data, 'name');
    assert.property(result.data, 'brand_icon');
    assert.property(result.data, 'created_at');
    assert.property(result.data, 'updated_at');
  });

  it('should not return organisation when organisation does not exist', async () => {
    const { statusCode } = await getRequest('/v2/organisations/1', admin.token);

    assert.equal(statusCode, 404);
  });

  it('should not return organisation when not an organisation member', async () => {
    const { statusCode } = await getRequest(`/v2/organisations/${organisation.id}`, notAnEmployee.token);

    assert.equal(statusCode, 403);
  });
});
