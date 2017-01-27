import { assert } from 'chai';
import blueprints from '../../../../shared/test-utils/blueprints';
import authenticate from '../../../../shared/test-utils/authenticate';
import { getRequest } from '../../../../shared/test-utils/request';
import * as userRepo from '../../../../modules/core/repositories/user';
import * as privateMessageService from '../services/private-message';
import * as conversationService from '../services/conversation';

describe('Get messages (v2)', () => {
  let creator;
  let creatorToken;
  let participant;
  let createdConversation;

  before(async () => {
    creator = await userRepo.createUser({
      ...blueprints.users.employee,
      username: 'conversation_creator' });

    participant = await userRepo.createUser({
      ...blueprints.users.employee,
      username: 'conversation_participant' });

    createdConversation = await conversationService.create({
      type: 'PRIVATE',
      participantIds: [creator.id, participant.id],
    }, { credentials: { id: creator.id } });

    creatorToken = (await authenticate(global.server, {
      username: creator.username,
      password: blueprints.users.employee.password,
    })).token;

    await privateMessageService.create({
      conversationId: createdConversation.id,
      text: 'First message',
    }, {
      credentials: { id: participant.id },
    });

    await privateMessageService.create({
      conversationId: createdConversation.id,
      text: 'Second message',
    }, {
      credentials: { id: participant.id },
    });

    await privateMessageService.create({
      conversationId: createdConversation.id,
      text: 'Last message',
    }, {
      credentials: { id: participant.id },
    });
  });

  after(async () => {
    await conversationService.remove({ conversationId: createdConversation.id });
    await [creator, participant].map(user => userRepo.deleteById(user.id));
  });

  it('should return messages for conversation', async () => {
    const endpoint = `/v2/conversations/${createdConversation.id}/messages`;
    const { result, statusCode } = await getRequest(endpoint, global.server, creatorToken);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 3);
    assert.equal(result.data[0].source.type, 'private_message');
    assert.isString(result.data[0].source.id);
    assert.equal(result.data[0].source.text, 'First message');
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
    const { result, statusCode } = await getRequest(endpoint, global.server, creatorToken);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 2);
    assert.equal(result.meta.pagination.total_count, 3);
    assert.equal(result.data[0].source.type, 'private_message');
    assert.isString(result.data[0].source.id);
    assert.equal(result.data[0].source.text, 'First message');
    assert.property(result.data[0], 'created_at');
    assert.equal(result.data[1].source.text, 'Second message');
  });

  it('should return messages for conversation limited by 2 starting from the second message',
  async () => {
    const endpoint = `/v2/conversations/${createdConversation.id}/messages?limit=2&offset=1`;
    const { result, statusCode } = await getRequest(endpoint, global.server, creatorToken);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 2);
    assert.equal(result.meta.pagination.total_count, 3);
    assert.equal(result.data[0].source.type, 'private_message');
    assert.isString(result.data[0].source.id);
    assert.equal(result.data[0].source.text, 'Second message');
    assert.property(result.data[0], 'created_at');
    assert.equal(result.data[1].source.text, 'Last message');
  });

  it('should return 404 code when conversation does not exist', async () => {
    const endpoint = '/v2/conversations/93523423423/messages';
    const { statusCode } = await getRequest(endpoint, global.server, creatorToken);

    assert.equal(statusCode, 404);
  });
});
