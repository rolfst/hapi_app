const { assert } = require('chai');
const { getRequest } = require('../../../../shared/test-utils/request');
const conversationRepo = require('../repositories/conversation');
const blueprints = require('../../../../shared/test-utils/blueprints');
const testHelper = require('../../../../shared/test-utils/helpers');
const messageRepo = require('../repositories/message');

describe('Get conversation', () => {
  let conversation;
  let employee;
  let admin;

  before(async () => {
    admin = await testHelper.createUser({ password: 'foo' });
    employee = await testHelper.createUser(blueprints.users.employee);

    const network = await testHelper.createNetwork({ userId: admin.id, name: 'flexAppeal' });
    const participants = [employee.id, admin.id];

    await testHelper.addUserToNetwork({ networkId: network.id, userId: employee.id });

    conversation = await conversationRepo.createConversation(
      'PRIVATE', admin.id, participants);

    await Promise.all([
      messageRepo.createMessage(conversation.id, admin.id, 'Test bericht 1'),
      messageRepo.createMessage(conversation.id, admin.id, 'Test bericht 2'),
    ]);
    await messageRepo.createMessage(conversation.id, employee.id, 'Last message');
  });

  after(() => testHelper.cleanAll());

  it('should return correct values', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}`;
    const { result, statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.id, conversation.id);
    assert.equal(result.data.users[0].id, employee.id);
    assert.equal(result.data.users[1].id, admin.id);
    assert.equal(result.data.last_message.text, 'Last message');
    assert.equal(result.data.messages.length, 3);
  });
});
