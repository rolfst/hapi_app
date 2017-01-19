import { assert } from 'chai';
import blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import { getRequest } from '../../../../shared/test-utils/request';
import { createMessage } from '../../v1/repositories/message';

describe('HandlerV2: Get messages', () => {
  let creator;
  let creatorToken;
  let participant;
  let createdConversation;

  before(async () => {
    creator = await testHelper.createUser({
      ...blueprints.users.admin,
      username: 'conversation_creator' });
    participant = await testHelper.createUser({
      ...blueprints.users.employee,
      username: 'conversation_participant' });

    const network = await testHelper.createNetwork({ userId: creator.id });

    await testHelper.addUserToNetwork({ networkId: network.id, userId: participant.id });
    await testHelper.addUserToNetwork({ networkId: network.id, userId: creator.id });

    const { tokens } = await testHelper.getLoginToken(
        { ...blueprints.users.admin,
          username: 'conversation_creator',
        });
    creatorToken = tokens.access_token;

    await createMessage(createdConversation.id, participant.id, 'First message');
    await createMessage(createdConversation.id, participant.id, 'Second message');
    await createMessage(createdConversation.id, participant.id, 'Last message');
  });

  after(async () => {
    return Promise.all([
      testHelper.deleteUser(participant),
      testHelper.deleteUser(creator),
    ]);
  });

  it('should return messages for conversation (v2)', async () => {
    const endpoint = `/v2/conversations/${createdConversation.id}/messages`;
    const { result, statusCode } = await getRequest(endpoint, creatorToken);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 3);
    assert.equal(result.data[0].type, 'conversation_message');
    assert.isString(result.data[0].id);
    assert.equal(result.data[0].conversation_id, createdConversation.id);
    assert.equal(result.data[0].text, 'First message');
    assert.equal(result.data[0].user_id, participant.id);
    assert.property(result.data[0], 'created_at');
    assert.equal(result.data[result.data.length - 1].text, 'Last message');
    assert.property(result, 'meta');
    assert.property(result.meta.pagination, 'offset');
    assert.property(result.meta.pagination, 'limit');
    assert.property(result.meta.pagination, 'total_count');
    assert.equal(result.meta.pagination.total_count, 3);
  });

  it('should return messages for conversation limited by 2', async () => {
    const endpoint = `/v2/conversations/${createdConversation.id}/messages?limit=2`;
    const { result, statusCode } = await getRequest(endpoint, creatorToken);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 2);
    assert.equal(result.meta.pagination.total_count, 3);
    assert.equal(result.data[0].type, 'conversation_message');
    assert.isString(result.data[0].id);
    assert.equal(result.data[0].conversation_id, createdConversation.id);
    assert.equal(result.data[0].text, 'First message');
    assert.equal(result.data[0].user_id, participant.id);
    assert.property(result.data[0], 'created_at');
    assert.equal(result.data[1].text, 'Second message');
  });

  it('should return messages for conversation limited by 2 starting from the second message',
  async () => {
    const endpoint = `/v2/conversations/${createdConversation.id}/messages?limit=2&offset=1`;
    const { result, statusCode } = await getRequest(endpoint, creatorToken);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 2);
    assert.equal(result.meta.pagination.total_count, 3);
    assert.equal(result.data[0].type, 'conversation_message');
    assert.isString(result.data[0].id);
    assert.equal(result.data[0].conversation_id, createdConversation.id);
    assert.equal(result.data[0].text, 'Second message');
    assert.equal(result.data[0].user_id, participant.id);
    assert.property(result.data[0], 'created_at');
    assert.equal(result.data[1].text, 'Last message');
  });

  it('should return 404 code when conversation does not exist', async () => {
    const endpoint = '/v2/conversations/93523423423/messages';
    const { statusCode } = await getRequest(endpoint, creatorToken);

    assert.equal(statusCode, 404);
  });
});
