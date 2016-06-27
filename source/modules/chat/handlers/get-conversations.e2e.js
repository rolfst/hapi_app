import { assert } from 'chai';
import { getRequest } from 'common/test-utils/request';

import {
  createConversation,
  deleteAllConversationsForUser,
} from 'modules/chat/repositories/conversation';


describe('Get conversations for logged user', () => {
  before(() => {
    return Promise.all([
      deleteAllConversationsForUser(global.authUser),
      createConversation('PRIVATE', global.authUser.id, [63, global.authUser.id]),
      createConversation('PRIVATE', global.authUser.id, [64, global.authUser.id]),
      createConversation('PRIVATE', global.authUser.id, [2698, global.authUser.id]),
    ]);
  });

  it('should return correct values', async () => {
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.lengthOf(result.data, 3);
    assert.equal(statusCode, 200);
  });

  it('should show participants of the conversation', async () => {
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.property(result.data[0], 'users');
    assert.lengthOf(result.data[0].users, 2);
    assert.equal(statusCode, 200);
  });

  it('should return empty array when no conversations found', async () => {
    await deleteAllConversationsForUser(global.authUser);
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.lengthOf(result.data, 0);
    assert.equal(statusCode, 200);
  });

  after(() => deleteAllConversationsForUser(global.authUser));
});
