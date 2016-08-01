import { assert } from 'chai';
import { postRequest } from 'common/test-utils/request';
import { createConversation } from 'modules/chat/repositories/conversation';

let conversation;

describe('Post message', () => {
  before(async () => {
    const { employee, admin } = global.users;
    conversation = await createConversation('PRIVATE', admin.id, [employee.id, admin.id]);
  });

  after(() => conversation.destroy());

  it('should show new message data', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}/messages`;
    const { result, statusCode } = await postRequest(endpoint, { text: 'Test message' });
    const { data } = result;

    assert.equal(data.conversation_id, conversation.id);
    assert.equal(data.text, 'Test message');
    assert.equal(data.created_by.id, global.users.admin.id);
    assert.equal(data.conversation.users.length, 2);
    assert.equal(statusCode, 200);
  });
});
