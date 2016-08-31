import { assert } from 'chai';
import { partial } from 'lodash';
import { deleteRequest } from 'common/test-utils/request';
import { createConversation } from 'modules/chat/repositories/conversation';

describe('Delete conversation', () => {
  let conversation;

  before(async () => {
    const conversationPartial = partial(createConversation, 'PRIVATE', global.users.admin.id);
    const participants = [global.users.employee.id, global.users.admin.id];
    const createdConversation = await conversationPartial(participants);
    conversation = createdConversation;
  });

  after(() => conversation.destroy());

  it('should return correct values', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}`;
    const { statusCode } = await deleteRequest(endpoint);

    assert.equal(statusCode, 200);
  });
});
