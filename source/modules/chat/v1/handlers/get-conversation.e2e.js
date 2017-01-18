import { assert } from 'chai';
import { getRequest } from '../../../../shared/test-utils/request';
import * as conversationRepo from '../repositories/conversation';
import * as blueprints from '../../../shared/test-utils/blueprints';
import * as testHelper from '../../../shared/test-utils/helpers';
import * as messageRepo from '../repositories/message';

describe('Get conversation', () => {
  let conversation;
  let employee;
  let admin;

  before(async () => {
    admin = await testHelper.createUser();
    employee = await testHelper.createUser(blueprints.users.employee);
    const network = await testHelper.createNetwork({ userId: admin.id });
    const participants = [employee.id, admin.id];

    await testHelper.addUserToNetwork({ networkId: network.id, userId: employee.id });
    await testHelper.addUserToNetwork({
      networkId: network.id, userId: admin.id, roleType: 'ADMIN' });

    conversation = await conversationRepo.createConversation(
      'PRIVATE', admin.id, participants);

    await Promise.all([
      messageRepo.createMessage(conversation.id, admin.id, 'Test bericht 1'),
      messageRepo.createMessage(conversation.id, admin.id, 'Test bericht 2'),
    ]);
    await messageRepo.createMessage(conversation.id, employee.id, 'Last message');
  });

  after(async () => {
    testHelper.cleanAll();
    conversationRepo.deleteConversationById(conversation.id);
  });

  it('should return correct values', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}`;
    const { tokens } = await testHelper.getLoginToken(blueprints.users.employee)
    const { result, statusCode } = await getRequest(endpoint, tokens.access_token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.id, conversation.id);
    assert.equal(result.data.users[0].id, employee.id);
    assert.equal(result.data.users[1].id, admin.id);
    assert.equal(result.data.last_message.text, 'Last message');
    assert.equal(result.data.messages.length, 3);
  });
});
