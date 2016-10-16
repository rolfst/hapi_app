import { assert } from 'chai';
import { find } from 'lodash';
import { getRequest } from '../../../shared/test-utils/request';
import * as conversationRepo from '../repositories/conversation';
import { createMessage } from '../repositories/message';

describe('Get messages', () => {
  let conversation;

  before(async () => {
    const participants = [global.users.employee.id, global.users.admin.id];
    conversation = await conversationRepo.createConversation(
      'PRIVATE', global.users.admin.id, participants);

    return Promise.all([
      createMessage(conversation.id, global.users.admin.id, 'Test bericht 1'),
      createMessage(conversation.id, global.users.admin.id, 'Test bericht 2'),
      createMessage(conversation.id, global.users.employee.id, 'Test bericht 3'),
    ]);
  });

  after(() => conversationRepo.deleteConversationById(conversation.id));

  it('should return messages for conversation', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}/messages`;
    const { result, statusCode } = await getRequest(endpoint);
    const actualMessage = find(result.data, { text: 'Test bericht 1' });

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 3);
    assert.isObject(actualMessage.created_by);
    assert.equal(actualMessage.created_by.id, global.users.admin.id);
  });
});
