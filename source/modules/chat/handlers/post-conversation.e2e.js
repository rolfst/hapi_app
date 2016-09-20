import { assert } from 'chai';
import { postRequest } from 'shared/test-utils/request';
import {
  createConversation,
  deleteAllConversationsForUser,
} from 'modules/chat/repositories/conversation';

let createdConversation;

describe('Post conversation', () => {
  before(async () => {
    const { admin, networklessUser } = global.users;
    createdConversation = await createConversation(
      'private', admin.id, [admin.id, networklessUser.id]
    );
  });

  after(() => deleteAllConversationsForUser(global.users.employee));

  it('should show new conversation data', async () => {
    const endpoint = '/v1/chats/conversations';
    const payload = { type: 'private', users: [global.users.employee.id] };
    const { result, statusCode } = await postRequest(endpoint, payload);

    assert.equal(result.data.users[0].id, global.users.employee.id);
    assert.equal(result.data.users[1].id, global.users.admin.id);
    assert.equal(statusCode, 200);
  });

  it('should return the existing conversation when there is already one created', async () => {
    const endpoint = '/v1/chats/conversations';
    const payload = { type: 'private', users: [global.users.networklessUser.id] };
    const { result, statusCode } = await postRequest(endpoint, payload);

    assert.equal(result.data.id, createdConversation.id);
    assert.equal(statusCode, 200);
  });
});
