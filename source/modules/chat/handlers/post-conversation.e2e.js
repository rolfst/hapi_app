import { assert } from 'chai';
import { postRequest } from 'common/test-utils/request';
import { deleteConversationById, createConversation } from 'modules/chat/repositories/conversation';

let conversation;
let conversationId;

describe('Post conversation', () => {
  before(async () => {
    conversation = await createConversation(
      'private',
      global.users.employee.id,
      [global.users.admin.id, global.users.networklessUser.id]
    );
  });

  after(() => Promise.all([
    deleteConversationById(conversationId),
    deleteConversationById(conversation.id),
  ]));

  it('should show new conversation data', async () => {
    const endpoint = '/v1/chats/conversations';
    const payload = { type: 'private', users: [global.users.employee.id] };
    const { result, statusCode } = await postRequest(endpoint, payload);

    conversationId = result.data.id;

    assert.equal(result.data.users[0].id, global.users.employee.id);
    assert.equal(result.data.users[1].id, global.users.admin.id);
    assert.equal(statusCode, 200);
  });

  it('should return the existing conversation when there is already one created', async () => {
    const endpoint = '/v1/chats/conversations';
    const payload = { type: 'private', users: [global.users.networklessUser.id] };
    const { result, statusCode } = await postRequest(endpoint, payload);

    assert.equal(result.data.id, conversation.id);
    assert.equal(statusCode, 200);
  });
});
