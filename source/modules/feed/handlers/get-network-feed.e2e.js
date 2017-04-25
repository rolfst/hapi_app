const { assert } = require('chai');
const { getRequest } = require('../../../shared/test-utils/request');
const testHelpers = require('../../../shared/test-utils/helpers');
const { ERoleTypes } = require('../../core/definitions');
const { EMessageTypes } = require('../definitions');
const messageService = require('../services/message');
const R = require('ramda');

describe('Handler: Get network feed', () => {
  let organisation;
  let network;
  let organisationAdmin;
  let otherUser;

  let createdMessages;

  let getUrl;

  before(async () => {
    [organisation, organisationAdmin, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    [network] = await Promise.all([
      testHelpers.createNetwork({
        userId: organisationAdmin.id,
        organisationId: organisation.id,
      }),
      testHelpers
        .addUserToOrganisation(organisationAdmin.id, organisation.id, ERoleTypes.ADMIN),
    ]);

    const createMessages = [];

    // Let's create a bunch of network messages
    for (let i = 0, n = 5; i < n; i += 1) {
      createMessages.push(messageService.create({
        parentType: 'network',
        parentId: network.id,
        messageType: EMessageTypes.DEFAULT,
        text: `Network message ${i}`,
      }, { credentials: organisationAdmin }));
    }

    await Promise.all(createMessages);

    createdMessages = await Promise.all([
      messageService.create({
        parentType: 'organisation',
        parentId: organisation.id,
        messageType: EMessageTypes.ORGANISATION,
        text: 'Organisation message #1',
      }, { credentials: organisationAdmin }),
      messageService.create({
        parentType: 'organisation',
        parentId: organisation.id,
        messageType: EMessageTypes.ORGANISATION,
        text: 'Organisation message #2',
      }, { credentials: organisationAdmin }),
    ]);

    getUrl = `/v3/networks/${network.id}/feed`;
  });

  after(() => testHelpers.cleanAll());

  it('should include organisation messages', async () => {
    const { statusCode, result } = await getRequest(getUrl, organisationAdmin.token);

    assert.equal(statusCode, 200);

    const organisationMessageaInFeed = R.filter(R.propEq('parent_type', 'organisation'), result.data);

    assert.lengthOf(organisationMessageaInFeed, createdMessages.length);
  });

  it('should fail if user is not a member of the network', async () => {
    const { statusCode } = await getRequest(getUrl, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
