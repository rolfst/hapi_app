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
      createConversation('PRIVATE', global.authUser.id, [2, global.authUser.id]),
      createConversation('PRIVATE', global.authUser.id, [3, global.authUser.id]),
      createConversation('PRIVATE', global.authUser.id, [4, global.authUser.id]),
    ]);
  });

  it('should return correct values', async () => {
    const response = await getRequest('/v1/chats/users/me/conversations');

    assert.lengthOf(response.result.data, 3);
    assert.equal(response.statusCode, 200);
  });

  it('should return empty array when no conversations found', async () => {
    await deleteAllConversationsForUser(global.authUser);
    const response = await getRequest('/v1/chats/users/me/conversations');

    assert.lengthOf(response.result.data, 0);
    assert.equal(response.statusCode, 200);
  });

  after(() => deleteAllConversationsForUser(global.authUser));
});
