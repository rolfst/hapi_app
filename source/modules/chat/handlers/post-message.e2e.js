import { assert } from 'chai';
import { postRequest } from 'common/test-utils/request';

import { createConversation, deleteConversationById } from 'modules/chat/repositories/conversation';

let conversation = null;

describe('Post message', () => {
  before(() => {
    return createConversation('PRIVATE', global.authUser.id, [5, global.authUser.id])
      .then(data => {
        conversation = data;
      });
  });

  it('should show new message data', () => {
    return postRequest(`/conversations/${conversation.id}/messages`, {
      text: 'Test message',
    }).then(response => {
      const { data } = response.result;

      assert.equal(data.conversation_id, conversation.id);
      assert.equal(data.text, 'Test message');
      assert.equal(data.created_by.id, global.authUser.id);
      assert.equal(response.statusCode, 200);
    });
  });

  after(() => {
    // TODO: Messages for this test won't delete in the db
    return conversation.destroy();
  });
});
