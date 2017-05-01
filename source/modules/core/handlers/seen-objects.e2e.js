const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');
const objectService = require('../services/object');

describe('Seen objects handler', () => {
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

    const { statusCode, result } = await postRequest(
      '/v2/seen_objects', {
        ids: idsToMark,
      },
      admin.token
    );

    assert.equal(statusCode, 200);

    const changedRecords = result.data;

    assert.deepEqual(changedRecords, idsToMark);
  });
});
