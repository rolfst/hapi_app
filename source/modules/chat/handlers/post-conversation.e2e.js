import { assert } from 'chai';
import { postRequest } from 'common/test-utils/request';
import { deleteConversationById } from 'modules/chat/repositories/conversation';

let conversationId;

describe('Post conversation', () => {
  after(() => deleteConversationById(conversationId));

  it('should show new conversation data', async () => {
    const endpoint = '/v1/chats/conversations';
    const data = { type: 'private', users: [global.users.employee.id] };
    const { result, statusCode } = await postRequest(endpoint, data);

    conversationId = result.data.id;

    assert.equal(result.data.users[0].id, global.users.employee.id);
    assert.equal(result.data.users[1].id, global.users.admin.id);
    assert.equal(statusCode, 200);
  });
});
