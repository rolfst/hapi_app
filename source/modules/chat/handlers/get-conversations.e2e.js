import { assert } from 'chai';
import blueprints from 'common/test-utils/blueprints';
import { createUser } from 'common/repositories/user';
import { getRequest } from 'common/test-utils/request';
import { createMessage } from 'modules/chat/repositories/message';
import {
  createConversation,
  deleteAllConversationsForUser,
} from 'modules/chat/repositories/conversation';

let user;
let conversation;

describe('Get conversations for logged user', () => {
  before(async () => {
    const creator = global.users.admin;
    const employee = blueprints.users.employee;
    user = await createUser({ ...employee, username: `${employee.username}3` });
    conversation = await createConversation('PRIVATE', creator.id, [user.id, creator.id]);

    await createMessage(conversation.id, user.id, 'First message');
    await createMessage(conversation.id, user.id, 'Last message');
  });

  after(async () => {
    await conversation.destroy();
    await user.destroy();
  });

  it('should return conversation collection', async () => {
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.lengthOf(result.data, 1);
    assert.equal(statusCode, 200);
  });

  it('should show participants of the conversation', async () => {
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.property(result.data[0], 'users');
    assert.lengthOf(result.data[0].users, 2);
    assert.equal(statusCode, 200);
  });

  it('should show the last placed message', async () => {
    const endpoint = '/v1/chats/users/me/conversations';
    const { result, statusCode } = await getRequest(endpoint);

    assert.equal(result.data[0].last_message.text, 'Last message');
    assert.equal(statusCode, 200);
  });

  it('should show the last placed message with messages included', async () => {
    const endpoint = '/v1/chats/users/me/conversations?include=messages';
    const { result, statusCode } = await getRequest(endpoint);

    assert.equal(result.data[0].last_message.text, 'Last message');
    assert.equal(statusCode, 200);
  });

  it('should return empty array when no conversations found', async () => {
    await deleteAllConversationsForUser(global.users.admin);
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.lengthOf(result.data, 0);
    assert.equal(statusCode, 200);
  });
});
