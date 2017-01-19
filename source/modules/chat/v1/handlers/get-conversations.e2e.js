import { assert } from 'chai';
import * as blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import { getRequest } from '../../../../shared/test-utils/request';
import * as userRepo from '../../../../modules/core/repositories/user';
import * as messageRepo from '../repositories/message';
import * as conversationRepo from '../repositories/conversation';

describe('Get conversations for logged user', () => {
  let user;
  let admin;
  let userWithoutMessage;
  let conversation;

  before(async () => {
    admin = await testHelper.createUser();
    user = await testHelper.createUser(blueprints.users.employee);
    userWithoutMessage = await testHelper.createUser(blueprints.users.networkless);
    const network = await testHelper.createNetwork({ userId: admin.id });
    const participants = [user.id, admin.id];

    await testHelper.addUserToNetwork({ networkId: network.id, userId: user.id });
    await testHelper.addUserToNetwork({ networkId: network.id, userId: userWithoutMessage.id });
    await testHelper.addUserToNetwork({
      networkId: network.id, userId: admin.id, roleType: 'ADMIN' });
                                  
    conversation = await conversationRepo.createConversation(
      'PRIVATE', admin.id, [user.id, admin.id]);

    await messageRepo.createMessage(conversation.id, user.id, 'First message');
    await messageRepo.createMessage(conversation.id, user.id, 'Last message');
  });

  after(async () => {
    const allUsers = await testHelper.findAllUsers();
    return testHelper.deleteUser(allUsers);
  });

  it('should return conversation collection', async () => {
    const { tokens } = await testHelper.getLoginToken(blueprints.users.employee);
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations',
        tokens.access_token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 1);
    console.log('%j', result.data[0])
    assert.equal(result.data[0].last_message.created_by.id, user.id);
    assert.equal(result.data[0].last_message.text, 'Last message');
  });

  it('should show participants of the conversation', async () => {
    const { tokens } = await testHelper.getLoginToken(blueprints.users.employee);
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations',
        tokens.access_token);

    assert.equal(statusCode, 200);
    assert.property(result.data[0], 'users');
    assert.lengthOf(result.data[0].users, 2);
  });

  it('should return the last created message in conversation in response', async () => {
    const { tokens } = await testHelper.getLoginToken(blueprints.users.employee);
    const endpoint = '/v1/chats/users/me/conversations';
    const { result, statusCode } = await getRequest(endpoint, tokens.access_token);

    assert.equal(statusCode, 200);
    assert.equal(result.data[0].last_message.text, 'Last message');
  });

  it('should return messages for each conversation', async () => {
    const { tokens } = await testHelper.getLoginToken(blueprints.users.employee);
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations',
        tokens.access_token);

    assert.equal(statusCode, 200);
    assert.property(result.data[0], 'messages');
    assert.lengthOf(result.data[0].messages, 2);
  });

  it('should return empty array when no conversations found', async () => {
    await conversationRepo.deleteAllConversationsForUser(admin.id);

    const { tokens } = await testHelper.getLoginToken(blueprints.users.networkless);
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations',
        tokens.access_token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 0);
  });
});
