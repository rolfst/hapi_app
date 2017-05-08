const R = require('ramda');
const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { putRequest } = require('../../../shared/test-utils/request');
const organisationRepo = require('../repositories/organisation');
const { NetworkUser } = require('../repositories/dao');
const createNetworkUserModel = require('../models/network-link');
const { ERoleTypes } = require('../definitions');

describe('Handler: Update user in networks', () => {
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
        userId: otherUser.id,
        organisationId: differentOrganisation.id,
      }),
      organisationRepo.addUser(admin.id, organisation.id, 'ADMIN'),
      organisationRepo.addUser(organisationUser.id, organisation.id),
    ]);

    await Promise.all([
      testHelpers.addUserToNetwork({ networkId: networkA.id, userId: organisationUser.id }),
      testHelpers.addUserToNetwork({ networkId: networkB.id, userId: organisationUser.id }),
    ]);

    endpoint = `/v2/organisations/${organisation.id}/users/${organisationUser.id}/networks`;
  });

  after(() => testHelpers.cleanAll());

  it('should update user in networks in organisation', async () => {
    const { statusCode } = await putRequest(endpoint, {
      networks: [{
        network_id: networkA.id,
        role_type: ERoleTypes.ADMIN,
      }, {
        network_id: networkB.id,
        role_type: ERoleTypes.ADMIN,
      }],
    }, admin.token);

    assert.equal(statusCode, 200);

    const actualEntries = await NetworkUser
      .findAll({ where: {
        networkId: {
          $in: [networkA.id, networkB.id],
        },
        userId: organisationUser.id,
        roleType: ERoleTypes.ADMIN,
      } })
      .then(R.map(createNetworkUserModel));

    assert.lengthOf(actualEntries, 2);
  });

  it('should fail when user is not an admin in the organisation', async () => {
    const { statusCode } = await putRequest(endpoint, {
      networks: [{
        network_id: networkA.id,
        role_type: ERoleTypes.ADMIN,
      }, {
        network_id: networkB.id,
        role_type: ERoleTypes.ADMIN,
      }],
    }, organisationUser.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when networks don\'t belong to the organisation', async () => {
    const { statusCode } = await putRequest(endpoint, {
      networks: [{
        network_id: differentOrganisationNetwork.id,
        role_type: ERoleTypes.ADMIN,
      }],
    }, admin.token);

    assert.equal(statusCode, 403);
  });
});
