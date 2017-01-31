import { assert } from 'chai';
import * as testHelper from '../../../../shared/test-utils/helpers';
import blueprints from '../../../../shared/test-utils/blueprints';
import { getRequest } from '../../../../shared/test-utils/request';
import * as messageService from '../../../feed/services/message';
import * as conversationService from '../services/conversation';

describe('Get conversations for logged user (v2)', () => {
  let creator;
  let creatorToken;
  let participant;
  const ENDPOINT_URL = '/v2/users/me/conversations';

  describe('Normal flow', () => {
    let createdConversation1;

    before(async () => {
      creator = await testHelper.createUser({
        ...blueprints.users.admin,
        username: 'conversation_creator' });
      participant = await testHelper.createUser({
        ...blueprints.users.employee,
        username: 'conversation_participant' });
      const otherParticipant = await testHelper.createUser({
        ...blueprints.users.employee,
        username: 'other_conversation_participant' });

      const network = await testHelper.createNetwork({ userId: creator.id });

      await testHelper.addUserToNetwork({ networkId: network.id, userId: participant.id });
      await testHelper.addUserToNetwork({ networkId: network.id, userId: creator.id });

      createdConversation1 = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant.id],
      }, { credentials: { id: creator.id } });

      await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, otherParticipant.id],
      }, { credentials: { id: creator.id } });

      const { tokens } = await testHelper.getLoginToken(
          { ...blueprints.users.admin,
            username: 'conversation_creator',
          });
      creatorToken = tokens.access_token;

      await messageService.create({
        parentType: 'conversation',
        parentId: createdConversation1.id,
        text: 'First message',
      }, {
        credentials: { id: participant.id },
      });

      await messageService.create({
        parentType: 'conversation',
        parentId: createdConversation1.id,
        text: 'Last message',
      }, {
        credentials: { id: participant.id },
      });
    });

    after(() => testHelper.cleanAll());

    it('should return conversation collection', async () => {
      const { result, statusCode } = await getRequest(ENDPOINT_URL, creatorToken);
      const conversationUnderTest = result.data[0];

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 2);
      assert.equal(conversationUnderTest.type, 'conversation');
      assert.equal(conversationUnderTest.id, createdConversation1.id);
      assert.equal(conversationUnderTest.user_id, creator.id);
      assert.property(conversationUnderTest, 'last_message');
      assert.property(conversationUnderTest.last_message, 'object_id');
      assert.equal(conversationUnderTest.last_message.text, 'Last message');
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
        `${ENDPOINT_URL}?include=participants`, creatorToken);
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

      createdConversation1 = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant.id],
      }, { credentials: { id: creator.id } });

      createdConversation2 = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant.id],
      }, { credentials: { id: creator.id } });

      await messageService.create({
        parentType: 'conversation',
        parentId: createdConversation1.id,
        text: 'First message',
      }, {
        credentials: { id: participant.id },
      });

      await messageService.create({
        parentType: 'conversation',
        parentId: createdConversation1.id,
        text: 'Last message',
      }, {
        credentials: { id: participant.id },
      });

      await messageService.create({
        parentType: 'conversation',
        parentId: createdConversation2.id,
        text: 'First message second conversation',
      }, {
        credentials: { id: participant.id },
      });
    });

    after(() => testHelper.cleanAll());

    it('should limit the output entries to defaults', async () => {
      const { result, statusCode } = await getRequest(ENDPOINT_URL, creatorToken);

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 2);
      assert.property(result, 'meta');
      assert.equal(result.meta.pagination.total_count, 2);
    });

    it('should return conversation collection with an amount of 1', async () => {
      const { result, statusCode } = await getRequest(`${ENDPOINT_URL}?limit=1`, creatorToken);
      const conversationUnderTest = result.data[0];

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 1);
      assert.equal(result.meta.pagination.total_count, 2);
      assert.equal(conversationUnderTest.type, 'conversation');
      assert.equal(conversationUnderTest.id, createdConversation1.id);
      assert.equal(conversationUnderTest.user_id, creator.id);
      assert.property(conversationUnderTest, 'last_message');
      assert.property(conversationUnderTest.last_message, 'object_id');
      assert.equal(conversationUnderTest.last_message.text, 'Last message');
      assert.deepEqual(conversationUnderTest.participant_ids, [creator.id, participant.id]);
      assert.property(conversationUnderTest, 'created_at');
    });

    it('should return conversation collection with an amount of 1 starting at the second',
      async () => {
        const { result, statusCode } = await getRequest(`${ENDPOINT_URL}?limit=1&offset=1`,
          creatorToken);
        const conversationUnderTest = result.data[0];

        assert.equal(statusCode, 200);
        assert.lengthOf(result.data, 1);
        assert.equal(conversationUnderTest.type, 'conversation');
        assert.equal(conversationUnderTest.id, createdConversation2.id);
        assert.equal(conversationUnderTest.user_id, creator.id);
        assert.property(conversationUnderTest, 'last_message');
        assert.property(conversationUnderTest.last_message, 'object_id');
        assert.equal(conversationUnderTest.last_message.text, 'First message second conversation');
        assert.deepEqual(conversationUnderTest.participant_ids, [creator.id, participant.id]);
        assert.property(conversationUnderTest, 'created_at');
      });
  });
});
