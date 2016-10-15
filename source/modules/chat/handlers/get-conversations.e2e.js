import { assert } from 'chai';
import blueprints from '../../../shared/test-utils/blueprints';
import * as userRepo from '../../../modules/core/repositories/user';
import { getRequest } from '../../../shared/test-utils/request';
import * as messageRepo from '../repositories/message';
import * as conversationRepo from '../repositories/conversation';

describe('Get conversations for logged user', () => {
  let user;
  let conversation;

  before(async () => {
    const creator = global.users.admin;
    const employee = blueprints.users.employee;
    user = await userRepo.createUser({ ...employee, username: `${employee.username}3` });
    conversation = await conversationRepo.createConversation(
      'PRIVATE', creator.id, [user.id, creator.id]);

    await messageRepo.createMessage(conversation.id, user.id, 'First message');
    await messageRepo.createMessage(conversation.id, user.id, 'Last message');
  });

  after(async () => {
    await conversationRepo.deleteConversationById(conversation.id);
    await userRepo.deleteById(user.id);
  });

  it('should return conversation collection', async () => {
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 1);
    assert.equal(result.data[0].last_message.created_by.id, user.id);
    assert.equal(result.data[0].last_message.text, 'Last message');
  });

  it('should show participants of the conversation', async () => {
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.equal(statusCode, 200);
    assert.property(result.data[0], 'users');
    assert.lengthOf(result.data[0].users, 2);
  });

  it('should return the last created message in conversation in response', async () => {
    const endpoint = '/v1/chats/users/me/conversations';
    const { result, statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 200);
    assert.equal(result.data[0].last_message.text, 'Last message');
  });

  it('should return messages for each converrsation', async () => {
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.equal(statusCode, 200);
    assert.property(result.data[0], 'messages');
    assert.lengthOf(result.data[0].messages, 2);
  });

  it('should return empty array when no conversations found', async () => {
    await conversationRepo.deleteAllConversationsForUser(global.users.admin.id);
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 0);
  });
});
