const { assert } = require('chai');
const { postRequest } = require('../../../shared/test-utils/request');
const testHelpers = require('../../../shared/test-utils/helpers');
const { ERoleTypes, EParentTypes } = require('../../core/definitions');
const { EMessageTypes } = require('../definitions');

describe('Handler: Create network message', () => {
  let organisation;
  let organisationAdmin;
  let otherUser;

  let network;

  let createUrl;
  const messageFixture = {
    text: 'My message to an entire network',
  };

  before(async () => {
    [organisation, organisationAdmin, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    [network] = await Promise.all([
      testHelpers.createNetwork({ organisationId: organisation.id, userId: organisationAdmin.id }),
      testHelpers.addUserToOrganisation(organisationAdmin.id, organisation.id, ERoleTypes.ADMIN),
    ]);

    createUrl = `/v3/networks/${network.id}/feed`;
  });

  after(() => testHelpers.cleanAll());

  it('should create a message', async () => {
    const { statusCode, result } =
      await postRequest(createUrl, messageFixture, organisationAdmin.token);

    assert.equal(statusCode, 200);

    assert.equal(result.data.parent_type, EParentTypes.NETWORK);
    assert.equal(result.data.parent_id, network.id);
    assert.equal(result.data.source.message_type, EMessageTypes.DEFAULT);
    assert.equal(result.data.source.text, messageFixture.text);
  });

  it('should fail if user is not a member of the network', async () => {
    const { statusCode } = await postRequest(createUrl, messageFixture, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
