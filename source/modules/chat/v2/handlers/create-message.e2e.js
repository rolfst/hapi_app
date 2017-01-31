import { assert } from 'chai';
import blueprints from '../../../../shared/test-utils/blueprints';
import authenticate from '../../../../shared/test-utils/authenticate';
import { postRequest } from '../../../../shared/test-utils/request';
import * as userRepo from '../../../../modules/core/repositories/user';
import * as conversationService from '../services/conversation';

describe('Handler: Create message (v2)', () => {
  let createdConversation;
  let creator;
  let participant;
  let creatorToken;

  before(async () => {
    creator = await userRepo.createUser({
      ...blueprints.users.employee,
      username: 'conversation_creator' });

    participant = await userRepo.createUser({
      ...blueprints.users.employee,
      username: 'conversation_participant' });

    creatorToken = (await authenticate(global.server, {
      username: creator.username,
      password: blueprints.users.employee.password,
    })).token;

    createdConversation = await conversationService.create({
      type: 'PRIVATE',
      participantIds: [creator.id, participant.id],
    }, { credentials: { id: creator.id } });
  });

  after(async () => {
    await conversationService.remove({ conversationId: createdConversation.id });
    await [creator, participant].map(user => userRepo.deleteById(user.id));
  });

  it('should return object model with new message as source', async () => {
    const ENDPOINT_URL = `/v2/conversations/${createdConversation.id}/messages`;
    const { result, statusCode } = await postRequest(ENDPOINT_URL, {
      text: 'My cool message',
    }, global.server, creatorToken);

    assert.equal(statusCode, 200);
    assert.equal(result.data.object_type, 'private_message');
    assert.equal(result.data.parent_id, createdConversation.id);
    assert.equal(result.data.parent_type, 'conversation');
    assert.property(result.data, 'source');
    assert.equal(result.data.source.text, 'My cool message');
  });
});
