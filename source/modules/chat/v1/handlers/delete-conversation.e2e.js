import { assert } from 'chai';
import { deleteRequest, getRequest } from '../../../../shared/test-utils/request';
import * as conversationRepo from '../repositories/conversation';

describe('Delete conversation', () => {
  let conversation;

  before(async () => {
    const participants = [global.users.employee.id, global.users.admin.id];
    conversation = await conversationRepo.createConversation(
      'PRIVATE', global.users.admin.id, participants);
  });

  it('should return correct values', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}`;
    await deleteRequest(endpoint);
    const { statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 404);
  });
});
