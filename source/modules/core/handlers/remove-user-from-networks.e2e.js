const R = require('ramda');
const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { deleteRequest } = require('../../../shared/test-utils/request');
const organisationRepo = require('../repositories/organisation');
const { NetworkUser } = require('../repositories/dao');
const createNetworkUserModel = require('../models/network-link');

describe('Handler: Remove user from networks', () => {
  let organisation;
  let differentOrganisation;
  let admin;
  let organisationUser;
  let otherUser;

  let networkA;
  let networkB;
  let networkC;
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

    [networkA, networkB, networkC, differentOrganisationNetwork] = await Promise.all([
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
        organisationId: organisation.id,
      }),
      testHelpers.createNetwork({
        userId: otherUser.id,
        organisationId: differentOrganisation.id,
      }),
      organisationRepo.addUser(admin.id, organisation.id, 'ADMIN'),
      organisationRepo.addUser(organisationUser.id, organisation.id),
    ]);

    await Promise.all([
      testHelpers.addUserToNetwork({ networkId: networkA.id, userId: organisationUser.id }),
      testHelpers.addUserToNetwork({ networkId: networkB.id, userId: organisationUser.id }),
      testHelpers.addUserToNetwork({ networkId: networkC.id, userId: organisationUser.id }),
    ]);

    endpoint = `/v2/organisations/${organisation.id}/users/${organisationUser.id}/networks`;
  });

  after(() => testHelpers.cleanAll());

  it('should remove user from networks in organisation', async () => {
    const { statusCode } = await deleteRequest(endpoint, {
      networks: [networkA.id, networkB.id],
    }, admin.token);

    assert.equal(statusCode, 200);

    const actualEntries = await NetworkUser
      .findAll({ where: {
        networkId: {
          $in: [networkA.id, networkB.id, networkC.id],
        },
        userId: organisationUser.id,
      } })
      .then(R.map(createNetworkUserModel));

    assert.lengthOf(actualEntries, 1);
  });

  it('should fail when user is not an admin in the organisation', async () => {
    const { statusCode } = await deleteRequest(endpoint, {
      networks: [networkA.id, networkB.id],
    }, organisationUser.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when networks don\'t belong to the organisation', async () => {
    const { statusCode } = await deleteRequest(endpoint, {
      networks: [differentOrganisationNetwork.id],
    }, admin.token);

    assert.equal(statusCode, 403);
  });
});
