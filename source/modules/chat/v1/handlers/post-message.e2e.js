import { assert } from 'chai';
import { postRequest } from '../../../../shared/test-utils/request';
import * as conversationRepo from '../repositories/conversation';

describe('Post message', () => {
  let conversation;

  before(async () => {
    const participants = [global.users.employee.id, global.users.admin.id];
    conversation = await conversationRepo.createConversation(
      'PRIVATE', global.users.admin.id, participants);
  });

  after(() => conversationRepo.deleteConversationById(conversation.id));

  it('should show new message data', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}/messages`;
    const { result, statusCode } = await postRequest(endpoint, { text: 'Test message' });
    const { data } = result;

    assert.equal(statusCode, 200);
    assert.equal(data.conversation_id, conversation.id);
    assert.equal(data.text, 'Test message');
    assert.equal(data.created_by.id, global.users.admin.id);
    assert.equal(data.conversation.users.length, 2);
  });
});
