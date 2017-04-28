const { assert } = require('chai');
const { deleteRequest, getRequest } = require('../../../../shared/test-utils/request');
const blueprints = require('../../../../shared/test-utils/blueprints');
const testHelper = require('../../../../shared/test-utils/helpers');
const conversationRepo = require('../repositories/conversation');

describe('Delete conversation', () => {
  let conversation;
  let admin;

  before(async () => {
    admin = await testHelper.createUser({ password: 'foo' });
    const employee = await testHelper.createUser(blueprints.users.employee);
    const network = await testHelper.createNetwork({ userId: admin.id, name: 'flexAppeal' });
    const participants = [employee.id, admin.id];

    await testHelper.addUserToNetwork({ networkId: network.id, userId: employee.id });

    conversation = await conversationRepo.createConversation('PRIVATE', admin.id, participants);
  });

  after(() => testHelper.cleanAll());

  it('should return correct values', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}`;

    await deleteRequest(endpoint, null, admin.token);
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 404);
  });
});
