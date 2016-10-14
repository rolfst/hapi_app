import { assert } from 'chai';
import { getRequest } from '../../../shared/test-utils/request';
import * as conversationRepo from '../repositories/conversation';
import * as messageRepo from '../repositories/message';

describe('Get conversation', () => {
  let conversation;

  before(async () => {
    const participants = [global.users.employee.id, global.users.admin.id];
    conversation = await conversationRepo.createConversation(
      'PRIVATE', global.users.admin.id, participants);

    await Promise.all([
      messageRepo.createMessage(conversation.id, global.users.admin.id, 'Test bericht 1'),
      messageRepo.createMessage(conversation.id, global.users.admin.id, 'Test bericht 2'),
    ]);

    await messageRepo.createMessage(conversation.id, global.users.employee.id, 'Last message');
  });

  after(() => conversationRepo.deleteConversationById(conversation.id));

  it('should return correct values', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 200);
    assert.equal(result.data.id, conversation.id);
    assert.equal(result.data.users[0].id, global.users.employee.id);
    assert.equal(result.data.users[1].id, global.users.admin.id);
    assert.equal(result.data.last_message.text, 'Last message');
  });
});
