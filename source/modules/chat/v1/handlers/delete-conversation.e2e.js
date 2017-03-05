import { assert } from 'chai';
import { deleteRequest, getRequest } from '../../../../shared/test-utils/request';
import * as blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import * as conversationRepo from '../repositories/conversation';

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

    await deleteRequest(endpoint, admin.token);
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 404);
  });
});
