const R = require('ramda');
const Promise = require('bluebird');
const { assert } = require('chai');
const sinon = require('sinon');
const { postRequest } = require('../../../shared/test-utils/request');
const testHelpers = require('../../../shared/test-utils/helpers');
const { ERoleTypes } = require('../../core/definitions');
const { EMessageTypes } = require('../definitions');
const messageService = require('../services/message');
const dispatcher = require('../dispatcher');
const Mixpanel = require('../../../shared/services/mixpanel');
const Intercom = require('../../../shared/services/intercom');
const Notifier = require('../../../shared/services/notifier');

describe('Handler: Create comment', () => {
  let organisation;
  let organisationAdmin;
  let otherUser;
  let createdMessages;

  let sandbox;
  let dispatcherEmitSpy;

  const messageFixture = {
    text: 'My witty comeback!',
  };

  before(async () => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(Mixpanel, 'track');
    sandbox.stub(Notifier, 'send');
    sandbox.stub(Intercom, 'createEvent');
    sandbox.stub(Intercom, 'incrementAttribute');
    dispatcherEmitSpy = sandbox.spy(dispatcher, 'emit');

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

  after(() => {
    sandbox.restore();
    return testHelpers.cleanAll();
  });

  it('should create a message', async () => {
    const createUrl = `/v2/messages/${createdMessages[0].sourceId}/comments`;
    const { statusCode, result } =
      await postRequest(createUrl, messageFixture, organisationAdmin.token);

    assert.equal(statusCode, 200);

    assert.equal(result.data.message_id, createdMessages[0].sourceId);
    assert.equal(result.data.user_id, organisationAdmin.id);
    assert.equal(result.data.text, messageFixture.text);
  });

  it.skip('should fail if user is not a member of the organisation - and probably more', async () => {
    const createUrl = `/v2/messages/${createdMessages[0].sourceId}/comments`;
    const { statusCode } = await postRequest(createUrl, messageFixture, otherUser.token);

    assert.equal(statusCode, 403);
  });

  it('shouldve dispatched with the right properties', async () => {
    assert(dispatcherEmitSpy.called);

    const args = R.find((argPair) => argPair[0] === 'comment.created', dispatcherEmitSpy.args);

    assert.isDefined(args);
    assert.isObject(args[1].comment);
    assert.isObject(args[1].message);
  });
});
