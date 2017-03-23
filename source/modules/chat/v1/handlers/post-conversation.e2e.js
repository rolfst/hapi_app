const { assert } = require('chai');
const { find } = require('lodash');
const blueprints = require('../../../../shared/test-utils/blueprints');
const testHelper = require('../../../../shared/test-utils/helpers');
const { postRequest } = require('../../../../shared/test-utils/request');
const conversationRepo = require('../repositories/conversation');
const messageRepo = require('../repositories/message');

let createdConversation;

describe('Post conversation', () => {
  const ENDPOINT_URL = '/v1/chats/conversations';
  let admin;
  let networklessUser;

  before(async () => {
    admin = await testHelper.createUser({ password: 'foo' });
    networklessUser = await testHelper.createUser(blueprints.users.networkless);
    await testHelper.createNetwork({ userId: admin.id });

    createdConversation = await conversationRepo.createConversation(
      'private', admin.id, [admin.id, networklessUser.id]
    );

    return messageRepo.createMessage(createdConversation.id, networklessUser.id, 'Foo text');
  });

  after(() => testHelper.cleanAll());

  it('should show new conversation data', async () => {
    const employee = await testHelper.createUser(blueprints.users.employee);
    const payload = { type: 'private', users: [employee.id] };
    const { result, statusCode } = await postRequest(ENDPOINT_URL, payload, networklessUser.token);
    await testHelper.deleteUser(employee);

    assert.equal(statusCode, 200);
    assert.property(result.data, 'messages');
    assert.isArray(result.data.messages);
    assert.isDefined(find(result.data.users, { id: employee.id }));
    assert.isDefined(find(result.data.users, { id: networklessUser.id }));
  });

  it('should return the existing conversation when there is already one created', async () => {
    const payload = { type: 'private', users: [networklessUser.id] };
    const { result, statusCode } = await postRequest(ENDPOINT_URL, payload, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.id, createdConversation.id);
    assert.property(result.data, 'messages');
    assert.isArray(result.data.messages);
    assert.equal(result.data.messages[0].created_by.id, networklessUser.id);
    assert.isDefined(find(result.data.users, { id: admin.id }));
    assert.isDefined(find(result.data.users, { id: networklessUser.id }));
  });

  it('should fail when creating conversation with yourself', async () => {
    const payload = { type: 'private', users: [admin.id.toString()] };
    const { statusCode } = await postRequest(ENDPOINT_URL, payload, admin.token);

    assert.equal(statusCode, 403);
  });
});
