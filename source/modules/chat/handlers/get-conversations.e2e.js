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

  it('should return correct values', () => {
    return getRequest('/users/me/conversations')
      .then(response => {
        assert.lengthOf(response.result.data, 3);
        assert.equal(response.statusCode, 200);
      });
  });

  after(() => {
    return deleteAllConversationsForUser(global.authUser);
  });
});
