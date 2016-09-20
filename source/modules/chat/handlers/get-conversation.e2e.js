import { assert } from 'chai';
import _ from 'lodash';
import { getRequest } from 'shared/test-utils/request';
import { createConversation } from 'modules/chat/repositories/conversation';
import { createMessage } from 'modules/chat/repositories/message';

let conversation;

describe('Get conversation', () => {
  before(async () => {
    const participants = [global.users.employee.id, global.users.admin.id];
    const withoutParticipants = _.partial(createConversation, 'PRIVATE', global.users.admin.id);
    const createdConversation = await withoutParticipants(participants);
    conversation = createdConversation;

    return Promise.all([
      createMessage(conversation.id, global.users.admin.id, 'Test bericht 1'),
      createMessage(conversation.id, global.users.admin.id, 'Test bericht 2'),
      createMessage(conversation.id, global.users.employee.id, 'Test bericht 3'),
      createMessage(conversation.id, global.users.employee.id, 'Test bericht 4'),
    ]);
  });

  after(() => conversation.destroy());

  it('should return correct values', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.equal(result.data.id, conversation.id);
    assert.equal(result.data.users[0].id, global.users.employee.id);
    assert.equal(result.data.users[1].id, global.users.admin.id);
    assert.equal(statusCode, 200);
  });

  it('should include messages in conversations', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}?include=messages`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.equal(result.data.id, conversation.id);
    assert.lengthOf(result.data.messages, 4);
    assert.equal(statusCode, 200);
  });
});
