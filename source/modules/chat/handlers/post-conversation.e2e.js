import { assert } from 'chai';
import { postRequest } from 'common/test-utils/request';

import { deleteConversationById } from 'modules/chat/repositories/conversation';

let conversationId = null;

describe('Post conversation', () => {
  it('should show new conversation data', () => {
    return postRequest('/v1/chats/conversations', {
      type: 'private',
      users: [5],
    }).then(response => {
      const { data } = response.result;
      conversationId = data.id;

      assert.equal(data.users[0].id, 5);
      assert.equal(data.users[1].id, global.authUser.id);
      assert.equal(response.statusCode, 200);
    });
  });

  after(() => {
    return deleteConversationById(conversationId);
  });
});
