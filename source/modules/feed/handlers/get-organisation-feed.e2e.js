const { assert } = require('chai');
const { getRequest } = require('../../../shared/test-utils/request');
const testHelpers = require('../../../shared/test-utils/helpers');
const { ERoleTypes, EObjectTypes, EParentTypes } = require('../../core/definitions');
const { EMessageTypes } = require('../../feed/definitions');
const messageService = require('../services/message');
const R = require('ramda');

describe('Handler: Get organisation news', () => {
  let organisationA;
  let organisationB;
  let organisationAdmin;
  let otherUser;
  let otherOrganisationUser;

  let getUrl;

  before(async () => {
    [organisationA,
    organisationB,
    organisationAdmin,
    otherUser,
    otherOrganisationUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    const [networkA] = await Promise.all([
      testHelpers.createNetwork({ userId: organisationAdmin.id, organisationId: organisationA.id }),
      testHelpers.createNetwork({ userId: otherUser.id, organisationId: organisationA.id }),
      testHelpers
        .addUserToOrganisation(organisationAdmin.id, organisationA.id, ERoleTypes.ADMIN),
      testHelpers
        .addUserToOrganisation(otherUser.id, organisationA.id, ERoleTypes.ADMIN),
      testHelpers
        .addUserToOrganisation(otherOrganisationUser.id, organisationB.id, ERoleTypes.ADMIN),
    ]);

    // Let's create a bunch of network messages
    const createMessages = R.map((i) => messageService.create({
      parentType: 'network',
      parentId: networkA.id,
      messageType: EMessageTypes.DEFAULT,
      text: `Network message ${i}`,
    }, { credentials: organisationAdmin }), R.range(0, 5));

    await Promise.all([
      ...createMessages,
      messageService.create({
        parentType: EObjectTypes.ORGANISATION,
        parentId: organisationA.id,
        messageType: EMessageTypes.ORGANISATION,
        text: 'Organisation message #1',
      }, { credentials: organisationAdmin }),
      messageService.create({
        parentType: EObjectTypes.ORGANISATION,
        parentId: organisationA.id,
        messageType: EMessageTypes.ORGANISATION,
        text: 'Organisation message #2',
      }, { credentials: organisationAdmin }),
      messageService.create({
        organisationId: organisationA.id,
        objectType: EObjectTypes.ORGANISATION_MESSAGE,
        parentType: EParentTypes.USER,
        parentId: organisationAdmin.id,
        text: 'Directed organisation message',
      }, { credentials: organisationAdmin }),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should include organisation messages', async () => {
    getUrl = `/v3/organisations/${organisationA.id}/news`;
    const { statusCode, result } = await getRequest(getUrl, organisationAdmin.token);

    assert.equal(statusCode, 200);

    const organisationMessagesInFeed = R.filter(R.propEq('parent_type', 'organisation'), result.data);

    assert.lengthOf(result.data, 3);
    assert.lengthOf(organisationMessagesInFeed, 3);
    assert.equal(result.meta.pagination.total_count, 3);
  });

  it('should not fail if user is not a member of the network within the same organisation', async () => {
    getUrl = `/v3/organisations/${organisationA.id}/news`;
    const { statusCode, result } = await getRequest(getUrl, otherUser.token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 2);
  });

  it('should fail if user is not a member of the same organisation', async () => {
    getUrl = `/v3/organisations/${organisationA.id}/news`;
    const { statusCode } = await getRequest(getUrl, otherOrganisationUser.token);

    assert.equal(statusCode, 403);
  });
});
