const { assert } = require('chai');
const { postRequest } = require('../../../shared/test-utils/request');
const testHelpers = require('../../../shared/test-utils/helpers');
const { ERoleTypes } = require('../../authorization/definitions');
const { EMessageTypes } = require('../definitions');

describe('Handler: Create organisation message', () => {
  let organisation;
  let organisationAdmin;
  let otherUser;

  let createUrl;
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

    createUrl = `/v2/organisations/${organisation.id}/messages`;
  });

  after(() => testHelpers.cleanAll());

  it('should create a message', async () => {
    const { statusCode, result } =
      await postRequest(createUrl, messageFixture, organisationAdmin.token);

    assert.equal(statusCode, 200);

    assert.equal(result.data.parent_type, 'organisation');
    assert.equal(result.data.parent_id, organisation.id);
    assert.equal(result.data.source.message_type, EMessageTypes.ORGANISATION);
    assert.equal(result.data.source.text, messageFixture.text);
  });

  it('should fail if user is not a member of the organisation', async () => {
    const { statusCode } = await postRequest(createUrl, messageFixture, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
