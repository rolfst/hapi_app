const { assert } = require('chai');
const R = require('ramda');
const { getRequest } = require('../../../shared/test-utils/request');
const testHelpers = require('../../../shared/test-utils/helpers');
const { ERoleTypes, EObjectTypes, EParentTypes } = require('../../core/definitions');
const { EMessageTypes } = require('../../feed/definitions');
const commentService = require('../services/comment');
const messageService = require('../services/message');

describe('Handler: Get organisation news', () => {
  let organisationA;
  let organisationB;
  let organisationAdmin;
  let otherUser;
  let otherOrganisationUser;
  let messageToBeFollowedUp;

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
      text: `Network message ${i}`,
    }, { credentials: organisationAdmin }), R.range(0, 5));

    const messages = await Promise.all([
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
        parentType: EParentTypes.USER,
        parentId: organisationAdmin.id,
        objectType: EObjectTypes.ORGANISATION_MESSAGE,
        text: 'Directed organisation message',
        organisationId: organisationA.id,
      }, { credentials: organisationAdmin }),
    ]);
    messageToBeFollowedUp = R.head(R.slice(-2, -1, messages));
    console.log(messageToBeFollowedUp)
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

  describe.only('meta', () => {
    before(async () => {
      await commentService.create({
        messageId: messageToBeFollowedUp.source.id,
        userId: otherUser.id,
        text: 'My insanely impossible comment',
      });
    });

    it('should include users related to feed including comments', async () => {
      getUrl = `/v3/organisations/${organisationA.id}/news?include=comments`;
      const { statusCode, result } = await getRequest(getUrl, organisationAdmin.token);

      assert.equal(statusCode, 200);

      const organisationMessagesInFeed = R.filter(R.propEq('parent_type', 'organisation'), result.data);

  console.log(JSON.stringify(result.meta, null, 2))
      assert.lengthOf(result.data, 3);
      assert.lengthOf(organisationMessagesInFeed, 3);
      assert.equal(result.meta.pagination.total_count, 3);
    });
  });
});
