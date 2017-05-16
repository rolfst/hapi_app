const { assert } = require('chai');
const { getRequest } = require('../../../shared/test-utils/request');
const testHelpers = require('../../../shared/test-utils/helpers');
const { ERoleTypes, EObjectTypes } = require('../../core/definitions');
const { EMessageTypes } = require('../definitions');
const messageService = require('../services/message');
const R = require('ramda');

describe('Handler: Get personal feed', () => {
  let organisation;
  let networkA;
  let networkB;
  let organisationAdmin;
  let otherUser;

  let createdOrganisationMessages;
  let createdNetworkMessages;
  let createdTeamMessages;

  let getUrl;

  before(async () => {
    [organisation, organisationAdmin, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    [networkA, networkB] = await Promise.all([
      testHelpers.createNetwork({
        userId: organisationAdmin.id,
        organisationId: organisation.id,
      }),
      testHelpers.createNetwork({
        userId: organisationAdmin.id,
        organisationId: organisation.id,
      }),
      testHelpers
        .addUserToOrganisation(organisationAdmin.id, organisation.id, ERoleTypes.ADMIN),
    ]);
    const [teamA, teamB] = await Promise.all([
      testHelpers.createTeamInNetwork(networkA.id),
      testHelpers.createTeamInNetwork(networkB.id),
    ]);

    // Let's create a bunch of messages
    const createNetworkAMessages = R.map((i) =>
      messageService.create(
        {
          parentType: EObjectTypes.NETWORK,
          parentId: networkA.id,
          messageType: EMessageTypes.DEFAULT,
          text: `NetworkA message ${i}`,
        },
        { credentials: organisationAdmin }),
      R.range(0, 5));
    const createNetworkBMessages = R.map((i) =>
      messageService.create(
        {
          parentType: 'network',
          parentId: networkB.id,
          messageType: EMessageTypes.DEFAULT,
          text: `NetworkB message ${i}`,
        },
        { credentials: organisationAdmin }),
      R.range(0, 5));
    createdNetworkMessages = R.concat(createNetworkAMessages, createNetworkBMessages);

    const createTeamAMessages = R.map((i) =>
      messageService.create(
        {
          parentType: EObjectTypes.TEAM,
          parentId: teamA.id,
          messageType: EMessageTypes.DEFAULT,
          text: `TeamA message ${i}`,
        },
        { credentials: organisationAdmin }),
      R.range(0, 2));
    const createTeamBMessages = R.map((i) =>
      messageService.create(
        {
          parentType: EObjectTypes.TEAM,
          parentId: teamB.id,
          messageType: EMessageTypes.DEFAULT,
          text: `TeamA message ${i}`,
        },
        { credentials: organisationAdmin }),
      R.range(0, 2));
    createdTeamMessages = R.concat(createTeamAMessages, createTeamBMessages);

    createdOrganisationMessages = R.map((i) =>
      messageService.create({
        parentType: EObjectTypes.ORGANISATION,
        parentId: organisation.id,
        messageType: EMessageTypes.ORGANISATION,
        text: `Organisation message #${i}`,
        organsationId: organisation.id,
      }, { credentials: organisationAdmin }),
    R.range(0, 2));

    await Promise.all([
      ...createdNetworkMessages,
      ...createdTeamMessages,
      ...createdOrganisationMessages,
    ]);
    getUrl = `/v3/organisations/${organisation.id}/feed?limit=50`;
  });

  after(() => testHelpers.cleanAll());

  it('should include organisation messages', async () => {
    const { statusCode, result } = await getRequest(getUrl, organisationAdmin.token);

    assert.equal(statusCode, 200);

    const organisationMessageaInFeed = R.filter(R.propEq('parent_type', EObjectTypes.ORGANISATION), result.data);
    const networkMessageaInFeed = R.filter(R.propEq('parent_type', EObjectTypes.NETWORK), result.data);
    const teamMessageaInFeed = R.filter(R.propEq('parent_type', EObjectTypes.TEAM), result.data);

    assert.lengthOf(organisationMessageaInFeed, createdOrganisationMessages.length, 'organisation messages not filled');
    assert.lengthOf(networkMessageaInFeed, createdNetworkMessages.length, 'network messages not filled');
    assert.lengthOf(teamMessageaInFeed, createdTeamMessages.length, 'team messages not filled');
  });

  it('should fail if user is not a member of the organisations', async () => {
    const { statusCode } = await getRequest(getUrl, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
