const R = require('ramda');
const Promise = require('bluebird');
const { assert } = require('chai');
const { postRequest } = require('../../../shared/test-utils/request');
const testHelpers = require('../../../shared/test-utils/helpers');
const { ERoleTypes } = require('../../core/definitions');
const { EMessageTypes } = require('../definitions');
const messageService = require('../services/message');

describe.skip('Handler: Create comment', () => {
  let organisation;
  let organisationAdmin;
  let otherUser;
  let createdMessages;

  const messageFixture = {
    text: 'My message to an entire organisation',
  };

  before(async () => {
    [organisation, organisationAdmin, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    await testHelpers
      .addUserToOrganisation(organisationAdmin.id, organisation.id, ERoleTypes.ADMIN);

    // Let's create a bunch of messages
    createdMessages = await Promise.map(R.range(1, 20),
      (number) => messageService.create({
        parentType: 'organisation',
        parentId: organisation.id,
        messageType: EMessageTypes.ORGANISATION,
        text: `Organisation message ${number}`,
      },
      { credentials: organisationAdmin })
    );
  });

  after(() => testHelpers.cleanAll());

  it('should create a message', async () => {
    console.log(createdMessages[0]);
    const createUrl = `/v2/messages/${createdMessages[0].sourceId}/messages`;
    const { statusCode, result } =
      await postRequest(createUrl, messageFixture, organisationAdmin.token);

    console.log(result)
    assert.equal(statusCode, 200);

    assert.equal(result.data.parent_type, 'organisation');
    assert.equal(result.data.parent_id, organisation.id);
    assert.equal(result.data.source.message_type, EMessageTypes.ORGANISATION);
    assert.equal(result.data.source.text, messageFixture.text);
  });

  it('should fail if user is not a member of the organisation', async () => {
    const createUrl = `/v2/messages/${createdMessages[0].sourceId}/messages`;
    const { statusCode } = await postRequest(createUrl, messageFixture, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
