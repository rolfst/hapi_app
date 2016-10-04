import { assert } from 'chai';
import { getRequest } from '../../../shared/test-utils/request';
import { createConversation } from '../repositories/conversation';
import { createMessage } from '../repositories/message';

let conversation;

describe('Get messages', () => {
  before(async () => {
    const participants = [global.users.employee.id, global.users.admin.id];
    conversation = await createConversation('PRIVATE', global.users.admin.id, participants);

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
