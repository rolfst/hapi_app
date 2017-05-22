const R = require('ramda');
const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');
const organisationRepo = require('../repositories/organisation');
const { NetworkUser } = require('../repositories/dao');
const createNetworkUserModel = require('../models/network-link');

describe('Handler: Add user to networks', () => {
  let organisation;
  let differentOrganisation;
  let admin;
  let organisationUser;
  let otherUser;
  let organisationAdmin;

  let networkA;
  let networkB;
  let differentOrganisationNetwork;

  let endpoint;

  before(async () => {
    [differentOrganisation, organisation, admin, organisationUser, otherUser, organisationAdmin] =
    await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
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
        userId: otherUser.id,
        organisationId: differentOrganisation.id,
      }),
      organisationRepo.addUser(admin.id, organisation.id, 'ADMIN'),
      organisationRepo.addUser(organisationAdmin.id, organisation.id, 'ADMIN'),
      organisationRepo.addUser(organisationUser.id, organisation.id),
    ]);

    endpoint = `/v2/organisations/${organisation.id}/users/${organisationUser.id}/networks`;
  });

  after(() => testHelpers.cleanAll());

  it('should add user to networks in organisation', async () => {
    const { statusCode } = await postRequest(endpoint, { networks: [
      { network_id: networkA.id },
      { network_id: networkB.id },
    ] }, admin.token);

    assert.equal(statusCode, 200);

    const actualEntries = await NetworkUser
      .findAll({ where: {
        networkId: {
          $in: [networkA.id, networkB.id],
        },
        userId: organisationUser.id,
      } })
      .then(R.map(createNetworkUserModel));

    assert.lengthOf(actualEntries, 2);
  });

  it('should fail when user is not an admin in the organisation', async () => {
    const { statusCode } = await postRequest(endpoint, { networks: [
      { network_id: networkA.id },
    ] }, organisationUser.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when networks don\'t belong to the organisation', async () => {
    const { statusCode } = await postRequest(endpoint, { networks: [
      { network_id: differentOrganisationNetwork.id },
    ] }, admin.token);

    assert.equal(statusCode, 403);
  });

  it('should succeed when organisationAdmin doesn\'t belong to the network', async () => {
    endpoint = `/v2/organisations/${organisation.id}/users/${organisationUser.id}/networks`;
    const { statusCode } = await postRequest(endpoint, { networks: [
      { network_id: networkB.id },
    ] }, organisationAdmin.token);

    assert.equal(statusCode, 200);
  });
});
