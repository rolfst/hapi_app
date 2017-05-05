const R = require('ramda');
const { assert } = require('chai');
const { getRequest } = require('../../../shared/test-utils/request');
const testHelpers = require('../../../shared/test-utils/helpers');
const { ERoleTypes } = require('../../core/definitions');
const { EMessageTypes } = require('../definitions');
const messageService = require('../services/message');
const commentService = require('../services/comment');
const { EIncludeTypes } = require('../../core/definitions');

describe('Handler: Get comments', () => {
  let organisation;
  let organisationAdmin;
  let otherUser;

  let message;

  let endpoint;

  before(async () => {
    [organisation, organisationAdmin, otherUser] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    await Promise.all([
      testHelpers.createNetwork({
        userId: organisationAdmin.id,
        organisationId: organisation.id,
      }),
      testHelpers
        .addUserToOrganisation(organisationAdmin.id, organisation.id, ERoleTypes.ADMIN),
    ]);

    message = await messageService.create({
      parentType: 'organisation',
      parentId: organisation.id,
      messageType: EMessageTypes.ORGANISATION,
      text: 'Organisation message #1',
    }, { credentials: organisationAdmin });

    await commentService.create({
      messageId: message.source.id,
      userId: otherUser.id,
      text: 'My insanely impossible comment',
    });

    endpoint = `/v2/messages/${message.source.id}/comments`;
  });

  after(() => testHelpers.cleanAll());

  it('should include related users in meta.related', async () => {
    const { statusCode, result } = await getRequest(`${endpoint}?include=${EIncludeTypes.USERS}`, organisationAdmin.token);

    assert.equal(statusCode, 200);

    assert.property(result, 'meta');
    assert.property(result.meta, 'related');
    assert.property(result.meta.related, 'users');
    assert.isArray(result.meta.related.users);

    const impossibleUser = R.find(R.propEq('id', otherUser.id), result.meta.related.users);

    const expectedUser = {
      id: otherUser.id,
      full_name: otherUser.fullName,
      profile_img: otherUser.profileImg,
    };

    assert.deepEqual(impossibleUser, expectedUser);
  });

  it('should include related users in meta.related without include query param', async () => {
    const { statusCode } = await getRequest(`${endpoint}`, organisationAdmin.token);

    assert.equal(statusCode, 200);
  });
});
