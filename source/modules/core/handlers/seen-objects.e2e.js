const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');
const objectService = require('../services/object');

describe('Handler: Seen objects', () => {
  let admin;
  let createdMessages;

  before(async () => {
    admin = await testHelpers.createUser({ password: 'foo' });
    const network = await testHelpers.createNetwork({ userId: admin.id });

    createdMessages = await Promise.all([
      objectService.create({
        networkId: network.id,
        userId: admin.id,
        parentType: 'network',
        parentId: network.id,
        objectType: 'poll',
        sourceId: '1931',
      }),
      objectService.create({
        networkId: network.id,
        userId: admin.id,
        parentType: 'network',
        parentId: network.id,
        objectType: 'feed_message',
        sourceId: '1932',
      }),
      objectService.create({
        networkId: network.id,
        userId: admin.id,
        parentType: 'network',
        parentId: network.id,
        objectType: 'feed_message',
        sourceId: '1933',
      }),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should be able to mark multiple messages as read', async () => {
    const idsToMark = [
      createdMessages[0].id,
      createdMessages[1].id,
    ];

    const { statusCode, result } = await postRequest('/v2/seen_objects', {
      ids: idsToMark,
    }, admin.token);

    assert.equal(statusCode, 200);
    assert.deepEqual(result.data, idsToMark);
  });

  it('should fail when marking already seen objects', async () => {
    const idsToMark = [
      createdMessages[0].id,
      createdMessages[1].id,
    ];

    const { statusCode, result } = await postRequest('/v2/seen_objects', {
      ids: idsToMark,
    }, admin.token);

    assert.equal(statusCode, 403);
    assert.equal(result.error_code, '50001');
  });

  it('should fail when passing non-existing object ids', async () => {
    const { statusCode } = await postRequest('/v2/seen_objects', {
      ids: [0],
    }, admin.token);

    assert.equal(statusCode, 422);
  });
});
