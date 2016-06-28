import { assert } from 'chai';
import { getRequest } from 'common/test-utils/request';
import { createConversation } from 'modules/chat/repositories/conversation';
import { createMessage } from 'modules/chat/repositories/message';

let conversation;

describe('Get messages', () => {
  before(async () => {
    const createdConversation = await createConversation('PRIVATE', global.users.admin.id, [global.users.employee.id, global.users.admin.id]);
    conversation = createdConversation;

    return Promise.all([
      createMessage(conversation.id, global.users.admin.id, 'Test bericht 1'),
      createMessage(conversation.id, global.users.admin.id, 'Test bericht 2'),
      createMessage(conversation.id, global.users.employee.id, 'Test bericht 3'),
    ]);
  });

  after(() => conversation.destroy());

  it('should return messages for conversation', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}/messages`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.lengthOf(result.data, 3);
    assert.equal(statusCode, 200);
  });
});
