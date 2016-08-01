import { assert } from 'chai';
import blueprints from 'common/test-utils/blueprints';
import { createUser } from 'common/repositories/user';
import { getRequest } from 'common/test-utils/request';

import {
  createConversation,
  deleteAllConversationsForUser,
} from 'modules/chat/repositories/conversation';

let users = [];
let conversations = [];

describe('Get conversations for logged user', () => {
  before(async () => {
    const creator = global.users.admin;
    const employee = blueprints.users.employee;
    const createdUsers = await Promise.all([
      createUser({ ...employee, username: `${employee.username}1` }),
      createUser({ ...employee, username: `${employee.username}2` }),
      createUser({ ...employee, username: `${employee.username}3` }),
    ]);

    const createdConversations = await Promise.all([
      createConversation('PRIVATE', creator.id, [createdUsers[0].id, creator.id]),
      createConversation('PRIVATE', creator.id, [createdUsers[1].id, creator.id]),
      createConversation('PRIVATE', creator.id, [createdUsers[2].id, creator.id]),
    ]);

    users = createdUsers;
    conversations = createdConversations;
  });

  after(() => Promise.all([
    conversations.map(c => c.destroy()),
    users.map(u => u.destroy()),
  ]));

  it('should return conversation collection', async () => {
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.lengthOf(result.data, 3);
    assert.equal(statusCode, 200);
  });

  it('should show participants of the conversation', async () => {
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.property(result.data[0], 'users');
    assert.lengthOf(result.data[0].users, 2);
    assert.equal(statusCode, 200);
  });

  it('should return empty array when no conversations found', async () => {
    await deleteAllConversationsForUser(global.users.admin);
    const { result, statusCode } = await getRequest('/v1/chats/users/me/conversations');

    assert.lengthOf(result.data, 0);
    assert.equal(statusCode, 200);
  });
});
