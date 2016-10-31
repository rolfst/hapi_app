import { assert } from 'chai';
import { find } from 'lodash';
import { postRequest } from '../../../shared/test-utils/request';
import * as conversationRepo from '../repositories/conversation';
import * as messageRepo from '../repositories/message';

let createdConversation;

describe('Post conversation', () => {
  const ENDPOINT_URL = '/v1/chats/conversations';

  before(async () => {
    const { admin, networklessUser } = global.users;
    createdConversation = await conversationRepo.createConversation(
      'private', admin.id, [admin.id, networklessUser.id]
    );

    return messageRepo.createMessage(createdConversation.id, networklessUser.id, 'Foo text');
  });

  after(() => conversationRepo.deleteAllConversationsForUser(global.users.employee.id));

  it('should show new conversation data', async () => {
    const payload = { type: 'private', users: [global.users.employee.id] };
    const { result, statusCode } = await postRequest(ENDPOINT_URL, payload);

    assert.equal(statusCode, 200);
    assert.property(result.data, 'messages');
    assert.isArray(result.data.messages);
    assert.isDefined(find(result.data.users, { id: global.users.employee.id }));
    assert.isDefined(find(result.data.users, { id: global.users.admin.id }));
  });

  it('should return the existing conversation when there is already one created', async () => {
    const payload = { type: 'private', users: [global.users.networklessUser.id] };
    const { result, statusCode } = await postRequest(ENDPOINT_URL, payload);

    assert.equal(statusCode, 200);
    assert.equal(result.data.id, createdConversation.id);
    assert.property(result.data, 'messages');
    assert.isArray(result.data.messages);
    assert.equal(result.data.messages[0].created_by.id, global.users.networklessUser.id);
    assert.isDefined(find(result.data.users, { id: global.users.admin.id }));
    assert.isDefined(find(result.data.users, { id: global.users.networklessUser.id }));
  });

  it('should fail when creating conversation with yourself', async () => {
    const payload = { type: 'private', users: [global.users.admin.id.toString()] };
    const { statusCode } = await postRequest(ENDPOINT_URL, payload);

    assert.equal(statusCode, 403);
  });
});
