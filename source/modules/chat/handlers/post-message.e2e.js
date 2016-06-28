import { assert } from 'chai';
import { postRequest } from 'common/test-utils/request';
import { createConversation } from 'modules/chat/repositories/conversation';

let conversation;

describe('Post message', () => {
  before(async () => {
    const createdConversation = await createConversation('PRIVATE', global.users.admin.id, [global.users.employee.id, global.users.admin.id]);
    conversation = createdConversation;
  });

  after(() => conversation.destroy());

  it('should show new message data', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}/messages`;
    const { result, statusCode } = await postRequest(endpoint, { text: 'Test message' });
    const { data } = result;

    assert.equal(data.conversation_id, conversation.id);
    assert.equal(data.text, 'Test message');
    assert.equal(data.created_by.id, global.users.admin.id);
    assert.equal(statusCode, 200);
  });
});
