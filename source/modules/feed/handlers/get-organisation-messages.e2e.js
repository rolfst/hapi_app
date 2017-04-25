const { assert } = require('chai');
const { getRequest } = require('../../../shared/test-utils/request');
const testHelpers = require('../../../shared/test-utils/helpers');
const { ERoleTypes } = require('../../core/definitions');
const { EMessageTypes, DEFAULT_MESSAGE_LIMIT } = require('../definitions');
const messageService = require('../services/message');
const R = require('ramda');

describe('Handler: Get organisation messages', () => {
  let organisation;
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

    await testHelpers
      .addUserToOrganisation(organisationAdmin.id, organisation.id, ERoleTypes.ADMIN);

    const createMessages = [];

    // Let's create a bunch of messages
    for (let i = 0, n = 20; i < n; i += 1) {
      createMessages.push(messageService.create({
        parentType: 'organisation',
        parentId: organisation.id,
        messageType: EMessageTypes.ORGANISATION,
        text: `Organisation message ${i}`,
      }, { credentials: organisationAdmin }));
    }

    createdMessages = await Promise.all(createMessages);

    getUrl = `/v2/organisations/${organisation.id}/messages`;
  });

  after(() => testHelpers.cleanAll());

  it('should fetch messages', async () => {
    const { statusCode, result } = await getRequest(getUrl, organisationAdmin.token);

    assert.equal(statusCode, 200);

    assert.lengthOf(
      result.data,
      createdMessages.length < DEFAULT_MESSAGE_LIMIT
        ? createdMessages.length
        : DEFAULT_MESSAGE_LIMIT
    );

    assert.equal(result.meta.pagination.total_count, createdMessages.length);

    // Let's verify the first item
    const singleObject = R.head(result.data);

    assert.property(singleObject, 'seen_count');
    assert.equal(singleObject.source.message_type, EMessageTypes.ORGANISATION);
  });

  it('should fail if user is not a member of the organisation', async () => {
    const { statusCode } = await getRequest(getUrl, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
