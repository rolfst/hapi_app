import { assert } from 'chai';
import { deleteRequest } from 'common/test-utils/request';

import { createConversation } from 'modules/chat/repositories/conversation';

let conversation = null;

describe('Delete conversation', () => {
  before(() => {
    return createConversation('PRIVATE', global.authUser.id, [63, global.authUser.id])
      .then(data => (conversation = data));
  });

  it('should return correct values', () => {
    return deleteRequest(`/v1/chats/conversations/${conversation.id}`)
      .then(response => {
        assert.property(response.result, 'message');
        assert.equal(response.statusCode, 200);
      });
  });
});
