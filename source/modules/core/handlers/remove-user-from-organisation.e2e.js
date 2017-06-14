const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { deleteRequest } = require('../../../shared/test-utils/request');
const organisationRepo = require('../repositories/organisation');
const { NetworkUser, OrganisationUser } = require('../repositories/dao');

describe('Handler: Remove user from organisation', () => {
  let organisation;
  let differentOrganisation;
  let admin;
  let organisationUser;
  let otherUser;

  let networkA;
  let networkB;
  let differentOrganisationNetwork;

  let endpoint;

  before(async () => {
    [differentOrganisation, organisation, admin, organisationUser, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    [networkA, networkB, differentOrganisationNetwork] = await Promise.all([
      testHelpers.createNetwork({
        userId: admin.id,
        organisationId: organisation.id,
      }),
      testHelpers.createNetwork({
        userId: admin.id,
        organisationId: organisation.id,
      }),
      testHelpers.createNetwork({
        userId: admin.id,
        organisationId: differentOrganisation.id,
      }),
      organisationRepo.addUser(admin.id, organisation.id, 'ADMIN'),
      organisationRepo.addUser(organisationUser.id, organisation.id, 'EMPLOYEE'),
    ]);

    await Promise.all([
      testHelpers.addUserToNetwork({ networkId: networkA.id, userId: organisationUser.id }),
      testHelpers.addUserToNetwork({ networkId: networkB.id, userId: organisationUser.id }),
      testHelpers.addUserToNetwork({
        networkId: differentOrganisationNetwork.id, userId: organisationUser.id }),
    ]);

    endpoint = `/v2/organisations/${organisation.id}/users/${organisationUser.id}`;
  });

  after(() => testHelpers.cleanAll());

  it('should remove user from organisation', async () => {
    const { statusCode } = await deleteRequest(endpoint, null, admin.token);

    assert.equal(statusCode, 200);

    const [actualNetworkUsers, actualOrganisationUser] = await Promise.all([
      NetworkUser.findAll({
        where: {
          networkId: { $in: [networkA.id, networkB.id] },
          userId: organisationUser.id,
        },
      }),
      OrganisationUser.find({
        where: {
          organisationId: organisation.id,
          userId: organisationUser.id,
        },
      }),
    ]);

    assert.isNotNull(actualNetworkUsers[0].deletedAt);
    assert.isNotNull(actualNetworkUsers[1].deletedAt);
    assert.isNotNull(actualOrganisationUser.deletedAt);
  });

  it('should fail when user is not an admin in the organisation', async () => {
    const { statusCode } = await deleteRequest(endpoint, null, organisationUser.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when user doesn\'t belong to organisation', async () => {
    const { statusCode } = await deleteRequest(
      `/v2/organisations/${organisation.id}/users/${otherUser.id}`, null, admin.token);

    assert.equal(statusCode, 400);
  });
});
