import { assert } from 'chai';
import { getRequest } from 'common/test-utils/request';

import { createConversation, deleteConversationById } from 'modules/chat/repositories/conversation';

let conversation = null;

describe('Get conversation', () => {
  before(() => {
    return createConversation('PRIVATE', global.authUser.id, [64, global.authUser.id])
      .then(data => {
        conversation = data;
      });
  });

  it('should return correct values', () => {
    return getRequest(`/conversations/${conversation.id}`)
      .then(response => {
        const { data } = response.result;

        assert.equal(data.id, conversation.id);
        assert.equal(data.users[0].id, 64);
        assert.equal(data.users[1].id, global.authUser.id);
        assert.equal(response.statusCode, 200);
      });
  });

  after(() => {
    return conversation.destroy();
  });
});
