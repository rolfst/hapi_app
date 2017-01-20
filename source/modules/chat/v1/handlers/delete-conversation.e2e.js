import { assert } from 'chai';
import { deleteRequest, getRequest } from '../../../../shared/test-utils/request';
import * as blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import * as conversationRepo from '../repositories/conversation';

describe('Delete conversation', () => {
  let conversation;
  let admin;
  let employee;

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
  });

  after(async () => {
    return Promise.all([
      testHelper.deleteUser(employee),
      testHelper.deleteUser(admin),
    ]);
  });

  it('should return correct values', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}`;
    const { tokens } = await testHelper.getLoginToken(blueprints.users.employee);

    await deleteRequest(endpoint, tokens.access_token);
    const { statusCode } = await getRequest(endpoint, tokens.access_token);

    assert.equal(statusCode, 404);
  });
});
