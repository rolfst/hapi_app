import { assert } from 'chai';
import Promise from 'bluebird';
import blueprints from '../../../../shared/test-utils/blueprints';
import * as userRepo from '../../../../modules/core/repositories/user';
import { getRequest } from '../../../../shared/test-utils/request';
import authenticate from '../../../../shared/test-utils/authenticate';
import * as privateMessageService from '../services/private-message';
import * as conversationService from '../services/conversation';

describe('Get conversations for logged user (v2)', () => {
  let creator;
  let creatorToken;
  let participant;
  let otherParticipant;
  const ENDPOINT_URL = '/v2/users/me/conversations';

  describe('Normal flow', () => {
    let createdConversation1;
    let createdConversation2;

    before(async () => {
      creator = await userRepo.createUser({
        ...blueprints.users.employee,
        username: 'conversation_creator' });

      participant = await userRepo.createUser({
        ...blueprints.users.employee,
        username: 'conversation_participant' });

      otherParticipant = await userRepo.createUser({
        ...blueprints.users.employee,
        username: 'other_conversation_participant' });

      createdConversation1 = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant.id],
      }, { credentials: { id: creator.id } });

      createdConversation2 = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, otherParticipant.id],
      }, { credentials: { id: creator.id } });

      creatorToken = (await authenticate(global.server, {
        username: creator.username,
        password: blueprints.users.employee.password,
      })).token;

      await privateMessageService.create({
        conversationId: createdConversation1.id,
        text: 'First message',
      }, {
        credentials: { id: participant.id },
      });

      await Promise.delay(1000).then(() => privateMessageService.create({
        conversationId: createdConversation1.id,
        text: 'Last message',
      }, {
        credentials: { id: participant.id },
      }));
    });

    after(async () => {
      await conversationService.remove({ conversationId: createdConversation1.id });
      await conversationService.remove({ conversationId: createdConversation2.id });
      await [creator, participant, otherParticipant].map(user => userRepo.deleteById(user.id));
    });

    it('should return conversation collection', async () => {
      const { result, statusCode } = await getRequest(ENDPOINT_URL, global.server, creatorToken);
      const conversationUnderTest = result.data[0];

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 2);
      assert.equal(conversationUnderTest.type, 'conversation');
      assert.equal(conversationUnderTest.id, createdConversation1.id);
      assert.equal(conversationUnderTest.user_id, creator.id);
      assert.property(conversationUnderTest, 'last_message');
      assert.equal(conversationUnderTest.last_message.source.type, 'private_message');
      assert.equal(conversationUnderTest.last_message.source.text, 'Last message');
      assert.deepEqual(conversationUnderTest.participant_ids, [creator.id, participant.id]);
      assert.property(conversationUnderTest, 'created_at');
      assert.property(result, 'meta');
      assert.property(result.meta.pagination, 'offset');
      assert.property(result.meta.pagination, 'limit');
      assert.property(result.meta.pagination, 'total_count');
      assert.equal(result.meta.pagination.total_count, 2);
    });

    it('should be able to include participants user objects', async () => {
      const { result, statusCode } = await getRequest(
        `${ENDPOINT_URL}?include=participants`, global.server, creatorToken);
      const conversationUnderTest = result.data[0];

      assert.equal(statusCode, 200);
      assert.property(conversationUnderTest, 'participants');
      assert.lengthOf(conversationUnderTest.participants, 2);
      assert.equal(conversationUnderTest.participants[0].id, creator.id);
      assert.equal(conversationUnderTest.participants[1].id, participant.id);
    });
  });

  describe('Limit flow', () => {
    let createdConversation1;
    let createdConversation2;

    before(async () => {
      creator = await userRepo.createUser({
        ...blueprints.users.employee,
        username: 'conversation_creator' });

      participant = await userRepo.createUser({
        ...blueprints.users.employee,
        username: 'conversation_participant' });

      createdConversation1 = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant.id],
      }, { credentials: { id: creator.id } });

      createdConversation2 = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant.id],
      }, { credentials: { id: creator.id } });

      creatorToken = (await authenticate(global.server, {
        username: creator.username,
        password: blueprints.users.employee.password,
      })).token;

      await privateMessageService.create({
        conversationId: createdConversation1.id,
        text: 'First message',
      }, {
        credentials: { id: participant.id },
      });

      await Promise.delay(1000).then(() => privateMessageService.create({
        conversationId: createdConversation1.id,
        text: 'Last message',
      }, {
        credentials: { id: participant.id },
      }));

      await Promise.delay(1000).then(() => privateMessageService.create({
        conversationId: createdConversation2.id,
        text: 'First message second conversation',
      }, {
        credentials: { id: participant.id },
      }));
    });

    after(async () => {
      await conversationService.remove({ conversationId: createdConversation1.id });
      await conversationService.remove({ conversationId: createdConversation2.id });
      await [creator, participant].map(user => userRepo.deleteById(user.id));
    });

    it('should limit the output entries to defaults', async () => {
      const { result, statusCode } = await getRequest(ENDPOINT_URL, global.server, creatorToken);

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 2);
      assert.property(result, 'meta');
      assert.equal(result.meta.pagination.total_count, 2);
    });

    it('should return conversation collection with an amount of 1', async () => {
      const { result, statusCode } = await getRequest(
          `${ENDPOINT_URL}?limit=1`, global.server, creatorToken);
      const conversationUnderTest = result.data[0];

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 1);
      assert.equal(result.meta.pagination.total_count, 2);
      assert.equal(conversationUnderTest.type, 'conversation');
      assert.equal(conversationUnderTest.id, createdConversation1.id);
      assert.equal(conversationUnderTest.user_id, creator.id);
      assert.property(conversationUnderTest, 'last_message');
      assert.property(conversationUnderTest.last_message, 'id');
      assert.equal(conversationUnderTest.last_message.source.text, 'Last message');
      assert.deepEqual(conversationUnderTest.participant_ids, [creator.id, participant.id]);
      assert.property(conversationUnderTest, 'created_at');
    });

    it('should return conversation collection with an amount of 1 starting at the second',
      async () => {
        const { result, statusCode } = await getRequest(`${ENDPOINT_URL}?limit=1&offset=1`,
          global.server, creatorToken);
        const conversationUnderTest = result.data[0];

        assert.equal(statusCode, 200);
        assert.lengthOf(result.data, 1);
        assert.equal(conversationUnderTest.type, 'conversation');
        assert.equal(conversationUnderTest.id, createdConversation2.id);
        assert.equal(conversationUnderTest.user_id, creator.id);
        assert.property(conversationUnderTest, 'last_message');
        assert.property(conversationUnderTest.last_message, 'id');
        assert.equal(conversationUnderTest.last_message.source.text,
          'First message second conversation');
        assert.deepEqual(conversationUnderTest.participant_ids, [creator.id, participant.id]);
        assert.property(conversationUnderTest, 'created_at');
      });
  });
});
