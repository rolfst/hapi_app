const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');
const organisationRepo = require('../repositories/organisation');

describe('Handler: Networks for organisation', () => {
  let organisation;
  let admin;
  let otherUser;

  before(async () => {
    [organisation, admin, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);


    return Promise.all([
      organisationRepo.addUser(admin.id, organisation.id, 'ADMIN'),
      testHelpers.createNetwork({
        userId: admin.id,
        organisationId: organisation.id,
      }),
      testHelpers.createNetwork({
        userId: admin.id,
        organisationId: organisation.id,
      }),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should return all networks for organisation', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/networks`;
    const { result } = await getRequest(endpoint, admin.token);

    assert.lengthOf(result.data, 2);
    assert.equal(result.data[0].users_count, 1);
  });

  it('should fail when user doesnt belong to the organisation', async () => {
    const endpoint = `/v2/organisations/${organisation.id}/networks`;
    const { statusCode } = await getRequest(endpoint, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
