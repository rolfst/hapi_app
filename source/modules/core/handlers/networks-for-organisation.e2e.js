const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');
const organisationRepo = require('../repositories/organisation');
const networkRepo = require('../repositories/network');

describe('Handler: Networks for organisation', () => {
  let organisation;
  let admin;
  let otherUser;
  let userToBeDeleted;

  before(async () => {
    [organisation, admin, otherUser, userToBeDeleted] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);


    const [network] = await Promise.all([
      testHelpers.createNetwork({
        userId: admin.id,
        organisationId: organisation.id,
      }),
      testHelpers.createNetwork({
        userId: admin.id,
        organisationId: organisation.id,
      }),
      organisationRepo.addUser(admin.id, organisation.id, 'ADMIN'),
    ]);

    await testHelpers.addUserToNetwork({ networkId: network.id, userId: userToBeDeleted.id });
    await networkRepo.removeUser(network.id, userToBeDeleted.id);
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
