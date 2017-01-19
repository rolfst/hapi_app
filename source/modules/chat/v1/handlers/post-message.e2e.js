import { assert } from 'chai';
import sinon from 'sinon';
import * as blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import * as notifier from '../../../../shared/services/notifier';
import { postRequest } from '../../../../shared/test-utils/request';
import * as conversationRepo from '../repositories/conversation';

describe('Post message', () => {
  let conversation;
  let sandbox;
  let admin;
  let user;

  before(async () => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(notifier, 'send').returns(null);

    admin = await testHelper.createUser();
    user = await testHelper.createUser(blueprints.users.employee);

    const network = await testHelper.createNetwork({ userId: admin.id });

    await testHelper.addUserToNetwork({ networkId: network.id, userId: user.id });
    await testHelper.addUserToNetwork({
      networkId: network.id, userId: admin.id, roleType: 'ADMIN' });

    conversation = await conversationRepo.createConversation(
      'PRIVATE', admin.id, [user.id, admin.id]);
  });

  after(async () => {
    sandbox.restore();
    const conversations = await testHelper.findAllConversations();
    return Promise.all([
        testHelper.deleteUser(user),
        testHelper.deleteUser(admin)
    ]);
  });

  it('should show new message data', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}/messages`;
    const { tokens } = await testHelper.getLoginToken(blueprints.users.employee);
    const { result, statusCode } = await postRequest(
        endpoint, { text: 'Test message' }, tokens.access_token);
    const { data } = result;

    assert.equal(statusCode, 200);
    assert.equal(data.conversation_id, conversation.id);
    assert.equal(data.text, 'Test message');
    assert.equal(data.created_by.id, user.id);
    assert.equal(data.conversation.users.length, 2);
  });
});
