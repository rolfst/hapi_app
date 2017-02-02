import { assert } from 'chai';
import blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import { getRequest } from '../../../../shared/test-utils/request';
import * as messageService from '../../../feed/services/message';
import * as conversationService from '../services/conversation';

describe('Handler: Get messages (v2)', () => {
  let creatorToken;
  let createdConversation;

  before(async () => {
    const creator = await testHelper.createUser({
      ...blueprints.users.admin,
      username: 'conversation_creator' });
    const participant = await testHelper.createUser({
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

    createdConversation = await conversationService.create({
      type: 'PRIVATE',
      participantIds: [creator.id, participant.id],
    }, { credentials: { id: creator.id } });

    await messageService.create({
      parentType: 'conversation',
      parentId: createdConversation.id,
      text: 'First message',
    }, {
      credentials: { id: participant.id },
    });

    await messageService.create({
      parentType: 'conversation',
      parentId: createdConversation.id,
      text: 'Second message',
    }, {
      credentials: { id: participant.id },
    });

    await messageService.create({
      parentType: 'conversation',
      parentId: createdConversation.id,
      text: 'Last message',
    }, {
      credentials: { id: participant.id },
    });
  });

  after(async () => testHelper.cleanAll());

  it('should return messages for conversation (v2)', async () => {
    const endpoint = `/v2/conversations/${createdConversation.id}/messages`;
    const { result, statusCode } = await getRequest(endpoint, creatorToken);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 3);
    assert.equal(result.data[0].source.type, 'message');
    assert.isString(result.data[0].source.id);
    assert.equal(result.data[0].source.text, 'First message');
    assert.property(result.data[0], 'object_id');
    assert.property(result.data[0], 'created_at');
    assert.equal(result.data[result.data.length - 1].source.text, 'Last message');
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
    assert.equal(result.data[0].source.type, 'message');
    assert.isString(result.data[0].source.id);
    assert.equal(result.data[0].source.text, 'First message');
    assert.property(result.data[0], 'object_id');
    assert.property(result.data[0], 'created_at');
    assert.equal(result.data[1].source.text, 'Second message');
  });

  it('should return messages for conversation limited by 2 starting from the second message',
  async () => {
    const endpoint = `/v2/conversations/${createdConversation.id}/messages?limit=2&offset=1`;
    const { result, statusCode } = await getRequest(endpoint, creatorToken);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 2);
    assert.equal(result.meta.pagination.total_count, 3);
    assert.equal(result.data[0].source.type, 'message');
    assert.isString(result.data[0].source.id);
    assert.equal(result.data[0].source.text, 'Second message');
    assert.property(result.data[0], 'object_id');
    assert.property(result.data[0], 'created_at');
    assert.equal(result.data[1].source.text, 'Last message');
  });

  it('should return 404 code when conversation does not exist', async () => {
    const endpoint = '/v2/conversations/93523423423/messages';
    const { statusCode } = await getRequest(endpoint, creatorToken);

    assert.equal(statusCode, 404);
  });
});
