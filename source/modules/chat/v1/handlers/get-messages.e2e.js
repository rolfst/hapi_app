const { assert } = require('chai');
const { find } = require('lodash');
const blueprints = require('../../../../shared/test-utils/blueprints');
const testHelper = require('../../../../shared/test-utils/helpers');
const { getRequest } = require('../../../../shared/test-utils/request');
const conversationRepo = require('../repositories/conversation');
const conversationService = require('../services/conversation');

describe('Handler: Get messages (v1)', () => {
  let conversation;
  let admin;
  let employee;

  before(async () => {
    admin = await testHelper.createUser({ password: 'foo' });
    employee = await testHelper.createUser(blueprints.users.employee);
    const network = await testHelper.createNetwork({ userId: admin.id, name: 'flexAppeal' });
    const participants = [employee.id, admin.id];

    await testHelper.addUserToNetwork({ networkId: network.id, userId: employee.id });

    conversation = await conversationRepo.createConversation(
      'PRIVATE', admin.id, participants);

    return Promise.all([
      conversationService.createMessage({
        id: conversation.id, text: 'Test bericht 1' }, {
          credentials: admin, artifacts: { authenticationToken: 'FOO_TOKEN' } }),
      conversationService.createMessage({
        id: conversation.id, text: 'Test bericht 2' }, {
          credentials: admin, artifacts: { authenticationToken: 'FOO_TOKEN' } }),
      conversationService.createMessage({
        id: conversation.id, text: 'Test bericht 3' }, {
          credentials: employee, artifacts: { authenticationToken: 'FOO_TOKEN' } }),
    ]);
  });

  after(() => testHelper.cleanAll());

  it('should return messages for conversation', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}/messages`;
    const { result, statusCode } = await getRequest(endpoint, employee.token);
    const actualMessage = find(result.data, { text: 'Test bericht 1' });

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 3);
    assert.equal(actualMessage.conversation_id, conversation.id);
    assert.isObject(actualMessage.created_by);
    assert.equal(actualMessage.created_by.id, admin.id);
  });
});
