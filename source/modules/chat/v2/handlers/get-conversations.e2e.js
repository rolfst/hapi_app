import { assert } from 'chai';
import blueprints from '../../../../shared/test-utils/blueprints';
import * as userRepo from '../../../../modules/core/repositories/user';
import { getRequest } from '../../../../shared/test-utils/request';
import authenticate from '../../../../shared/test-utils/authenticate';
import * as messageRepo from '../../v1/repositories/message';
import * as conversationRepo from '../../v1/repositories/conversation';

describe('Get conversations for logged user (v2)', () => {
  let creator;
  let creatorToken;
  let participant;
  let createdConversation;
  const ENDPOINT_URL = '/v2/users/me/conversations';

  describe('normal flow', () => {
    before(async () => {
      creator = await userRepo.createUser({
        ...blueprints.users.employee,
        username: 'conversation_creator' });

      participant = await userRepo.createUser({
        ...blueprints.users.employee,
        username: 'conversation_participant' });

      createdConversation = await conversationRepo.createConversation(
        'PRIVATE', creator.id, [creator.id, participant.id]);

      creatorToken = (await authenticate(global.server, {
        username: creator.username,
        password: blueprints.users.employee.password,
      })).token;

      await messageRepo.createMessage(createdConversation.id, participant.id, 'First message');
      await messageRepo.createMessage(createdConversation.id, participant.id, 'Last message');
    });

    after(async () => {
      await conversationRepo.deleteConversationById(createdConversation.id);
      await [creator, participant].map(user => userRepo.deleteById(user.id));
    });

    it('should return conversation collection', async () => {
      const { result, statusCode } = await getRequest(ENDPOINT_URL, global.server, creatorToken);
      const conversationUnderTest = result.data[0];

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 1);
      assert.equal(conversationUnderTest.type, 'conversation');
      assert.equal(conversationUnderTest.id, createdConversation.id);
      assert.equal(conversationUnderTest.user_id, creator.id);
      assert.property(conversationUnderTest, 'last_message');
      assert.equal(conversationUnderTest.last_message.user_id, participant.id);
      assert.equal(conversationUnderTest.last_message.text, 'Last message');
      assert.equal(conversationUnderTest.last_message.conversation_id, createdConversation.id);
      assert.deepEqual(conversationUnderTest.participant_ids, [creator.id, participant.id]);
      assert.property(conversationUnderTest, 'created_at');
      assert.property(result, 'meta');
      assert.property(result.meta.pagination, 'offset');
      assert.property(result.meta.pagination, 'limit');
      assert.property(result.meta.pagination, 'total_count');
      assert.equal(result.meta.pagination.total_count, 1);
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

  describe('limit flow', () => {
    let createdConversation1;
    let createdConversation2;

    before(async () => {
      creator = await userRepo.createUser({
        ...blueprints.users.employee,
        username: 'conversation_creator' });

      participant = await userRepo.createUser({
        ...blueprints.users.employee,
        username: 'conversation_participant' });

      createdConversation1 = await conversationRepo.createConversation(
        'PRIVATE', creator.id, [creator.id, participant.id]);
      createdConversation2 = await conversationRepo.createConversation(
        'PRIVATE', creator.id, [creator.id, participant.id]);

      creatorToken = (await authenticate(global.server, {
        username: creator.username,
        password: blueprints.users.employee.password,
      })).token;

      await messageRepo.createMessage(createdConversation1.id, participant.id, 'First message');
      await messageRepo.createMessage(createdConversation1.id, participant.id, 'Last message');
      await messageRepo.createMessage(createdConversation2.id, participant.id,
          'First message second conversation');
    });

    after(async () => {
      await conversationRepo.deleteConversationById(createdConversation1.id);
      await conversationRepo.deleteConversationById(createdConversation2.id);
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
      assert.equal(conversationUnderTest.last_message.user_id, participant.id);
      assert.equal(conversationUnderTest.last_message.text, 'Last message');
      assert.equal(conversationUnderTest.last_message.conversation_id, createdConversation1.id);
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
        assert.equal(conversationUnderTest.last_message.user_id, participant.id);
        assert.equal(conversationUnderTest.last_message.text, 'First message second conversation');
        assert.equal(conversationUnderTest.last_message.conversation_id, createdConversation2.id);
        assert.deepEqual(conversationUnderTest.participant_ids, [creator.id, participant.id]);
        assert.property(conversationUnderTest, 'created_at');
      });
  });
});
