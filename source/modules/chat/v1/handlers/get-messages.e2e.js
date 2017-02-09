import { assert } from 'chai';
import { find } from 'lodash';
import * as blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import { getRequest } from '../../../../shared/test-utils/request';
import * as conversationRepo from '../repositories/conversation';
import { createMessage } from '../repositories/message';

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
      createMessage(conversation.id, admin.id, 'Test bericht 1'),
      createMessage(conversation.id, admin.id, 'Test bericht 2'),
      createMessage(conversation.id, employee.id, 'Test bericht 3'),
    ]);
  });

  after(() => testHelper.cleanAll());

  it('should return messages for conversation', async () => {
    const endpoint = `/v1/chats/conversations/${conversation.id}/messages`;

    const { result, statusCode } = await getRequest(endpoint, employee.token);
    const actualMessage = find(result.data, { text: 'Test bericht 1' });

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 3);
    assert.isObject(actualMessage.created_by);
    assert.equal(actualMessage.created_by.id, admin.id);
  });
});
