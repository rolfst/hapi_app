import { assert } from 'chai';
import * as blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import { postRequest } from '../../../../shared/test-utils/request';
import * as conversationRepo from '../repositories/conversation';

describe.only('Post message', () => {
  let conversation;

  before(async () => {
    const admin = await testHelper.createUser();
    const user = await testHelper.createUser(blueprints.users.employee);
    const network = await testHelper.createNetwork({ userId: admin.id });

    await testHelper.addUserToNetwork({ networkId: network.id, userId: user.id });
    await testHelper.addUserToNetwork({
      networkId: network.id, userId: admin.id, roleType: 'ADMIN' });

    conversation = await conversationRepo.createConversation(
      'PRIVATE', admin.id, [user.id, admin.id]);
  });

  after(async () => testHelper.cleanAll());

  it('should show new message data', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}/messages`;
    const { tokens } = await testHelper.getLoginToken(blueprints.users.employee);
    const { result, statusCode } = await postRequest(
        endpoint, { text: 'Test message' }, tokens.access_token);
    const { data } = result;

    assert.equal(statusCode, 200);
    assert.equal(data.conversation_id, conversation.id);
    assert.equal(data.text, 'Test message');
    assert.equal(data.created_by.id, global.users.admin.id);
    assert.equal(data.conversation.users.length, 2);
  });
});
