import { assert } from 'chai';
import Promise from 'bluebird';
import * as blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import { getRequest } from '../../../../shared/test-utils/request';
import * as messageRepo from '../repositories/message';
import * as conversationRepo from '../repositories/conversation';

describe('Get conversations for logged user', () => {
  let user;
  let admin;
  let userWithoutMessage;
  let conversation;

  before(async () => {
    admin = await testHelper.createUser({ password: 'foo' });
    user = await testHelper.createUser(blueprints.users.employee);
    userWithoutMessage = await testHelper.createUser(blueprints.users.networkless);
    const network = await testHelper.createNetwork({ userId: admin.id, name: 'flexAppeal' });

    await testHelper.addUserToNetwork({ networkId: network.id, userId: user.id });
    await testHelper.addUserToNetwork({ networkId: network.id, userId: userWithoutMessage.id });

    conversation = await conversationRepo.createConversation(
      'PRIVATE', admin.id, [user.id, admin.id]);

    await Promise.delay(1000)
      .then(() => messageRepo.createMessage(conversation.id, user.id, 'First message'));
    await Promise.delay(1000)
      .then(() => messageRepo.createMessage(conversation.id, user.id, 'Last message'));
  });

  after(() => testHelper.cleanAll());

  it('should return conversation collection', async () => {
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations',
        user.token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 1);
    assert.equal(result.data[0].last_message.created_by.id, user.id);
    assert.equal(result.data[0].last_message.text, 'Last message');
  });

  it('should show participants of the conversation', async () => {
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations',
        user.token);

    assert.equal(statusCode, 200);
    assert.property(result.data[0], 'users');
    assert.lengthOf(result.data[0].users, 2);
  });

  it('should return the last created message in conversation in response', async () => {
    const endpoint = '/v1/chats/users/me/conversations';
    const { result, statusCode } = await getRequest(endpoint, user.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data[0].last_message.text, 'Last message');
  });

  it('should return messages for each conversation', async () => {
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations',
        user.token);

    assert.equal(statusCode, 200);
    assert.property(result.data[0], 'messages');
    assert.lengthOf(result.data[0].messages, 2);
  });

  it('should return empty array when no conversations found', async () => {
    await conversationRepo.deleteAllConversationsForUser(admin.id);

    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations',
        userWithoutMessage.token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 0);
  });

  it('should have an new updatedAt', async () => {
    const { result } = await getRequest('/v1/chats/users/me/conversations',
        user.token);

    assert.isNotNull(conversation, 'updatedAt');
    assert.isNotNull(result.data[0], 'updatedAt');
    assert.notEqual(conversation.updatedAt, result.data[0].updatedAt);
  });
});
