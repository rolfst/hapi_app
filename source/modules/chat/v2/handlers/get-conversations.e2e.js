import { assert } from 'chai';
import * as testHelper from '../../../../shared/test-utils/helpers';
import Promise from 'bluebird';
import blueprints from '../../../../shared/test-utils/blueprints';
import { getRequest } from '../../../../shared/test-utils/request';
import * as privateMessageService from '../services/private-message';
import * as conversationService from '../services/conversation';

describe('Get conversations for logged user (v2)', () => {
  let creator;
  let participant1;
  let participant2;
  const ENDPOINT_URL = '/v2/users/me/conversations';

  describe('Normal flow', () => {
    let createdConversation1;

    before(async () => {
      [creator, participant1, participant2] = await Promise.all([
        testHelper.createUser(),
        testHelper.createUser(),
        testHelper.createUser(),
      ]);

      const network = await testHelper.createNetwork({ userId: creator.id });

      await testHelper.addUserToNetwork({ networkId: network.id, userId: participant1.id });
      await testHelper.addUserToNetwork({ networkId: network.id, userId: creator.id });

      createdConversation1 = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant1.id],
      }, { credentials: creator });

      const createdConversation2 = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant2.id],
      }, { credentials: creator });

      await privateMessageService.create({
        conversationId: createdConversation1.id,
        text: 'First message',
      }, {
        credentials: participant1,
        artifacts: { authenticationToken: 'foo' },
      });

      await Promise.delay(1000).then(() => privateMessageService.create({
        conversationId: createdConversation2.id,
        text: 'First message second conversation',
      }, {
        credentials: participant1,
        artifacts: { authenticationToken: 'foo' },
      }));

      await Promise.delay(1000).then(() => privateMessageService.create({
        conversationId: createdConversation1.id,
        text: 'Last message',
      }, {
        credentials: participant1,
        artifacts: { authenticationToken: 'foo' },
      }));
    });

    after(() => testHelper.cleanAll());

    it('should return conversation collection', async () => {
      const { result, statusCode } = await getRequest(ENDPOINT_URL, creator.token);
      const conversationUnderTest = result.data[0];

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 2);
      assert.equal(conversationUnderTest.type, 'conversation');
      assert.equal(conversationUnderTest.id, createdConversation1.id);
      assert.equal(conversationUnderTest.user_id, creator.id);
      assert.property(conversationUnderTest, 'last_message');
      assert.equal(conversationUnderTest.last_message.source.type, 'private_message');
      assert.equal(conversationUnderTest.last_message.source.text, 'Last message');
      assert.deepEqual(conversationUnderTest.participant_ids, [creator.id, participant1.id]);
      assert.property(conversationUnderTest, 'created_at');
      assert.property(result, 'meta');
      assert.property(result.meta.pagination, 'offset');
      assert.property(result.meta.pagination, 'limit');
      assert.property(result.meta.pagination, 'total_count');
      assert.equal(result.meta.pagination.total_count, 2);
    });

    it('should be able to include participants user objects', async () => {
      const { result, statusCode } = await getRequest(
        `${ENDPOINT_URL}?include=participants`, creator.token);
      const conversationUnderTest = result.data[0];

      assert.equal(statusCode, 200);
      assert.property(conversationUnderTest, 'participants');
      assert.lengthOf(conversationUnderTest.participants, 2);
      assert.equal(conversationUnderTest.participants[0].id, creator.id);
      assert.equal(conversationUnderTest.participants[1].id, participant1.id);
    });
  });

  describe('Limit flow', () => {
    let createdConversation1;
    let createdConversation2;

    before(async () => {
      creator = await testHelper.createUser({
        ...blueprints.users.creator,
        username: 'conversation_creator' });
      participant1 = await testHelper.createUser({
        ...blueprints.users.employee,
        username: 'conversation_participant1' });
      participant2 = await testHelper.createUser({
        ...blueprints.users.employee,
        username: 'conversation_participant2' });

      const network = await testHelper.createNetwork({ userId: creator.id });

      await testHelper.addUserToNetwork({ networkId: network.id, userId: participant1.id });
      await testHelper.addUserToNetwork({ networkId: network.id, userId: creator.id });

      createdConversation1 = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant1.id],
      }, { credentials: creator });

      createdConversation2 = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant2.id],
      }, { credentials: creator });

      await privateMessageService.create({
        conversationId: createdConversation1.id,
        text: 'First message',
      }, {
        credentials: participant1,
        artifacts: { authenticationToken: 'foo' },
      });

      await Promise.delay(1000).then(() => privateMessageService.create({
        conversationId: createdConversation1.id,
        text: 'Last message',
      }, {
        credentials: participant1,
        artifacts: { authenticationToken: 'foo' },
      }));

      await Promise.delay(1000).then(() => privateMessageService.create({
        conversationId: createdConversation2.id,
        text: 'First message second conversation',
      }, {
        credentials: participant1,
        artifacts: { authenticationToken: 'foo' },
      }));
    });

    after(() => testHelper.cleanAll());

    it('should limit the output entries to defaults', async () => {
      const { result, statusCode } = await getRequest(ENDPOINT_URL, creator.token);

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 2);
      assert.property(result, 'meta');
      assert.equal(result.meta.pagination.total_count, 2);
    });

    it('should return conversation collection with an amount of 1', async () => {
      const { result, statusCode } = await getRequest(`${ENDPOINT_URL}?limit=1`, creator.token);
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
      assert.deepEqual(conversationUnderTest.participant_ids, [creator.id, participant1.id]);
      assert.property(conversationUnderTest, 'created_at');
    });

    it('should return conversation collection with an amount of 1 starting at the second',
      async () => {
        const { result, statusCode } = await getRequest(
          `${ENDPOINT_URL}?limit=1&offset=1`, creator.token);
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
        assert.deepEqual(conversationUnderTest.participant_ids, [creator.id, participant2.id]);
        assert.property(conversationUnderTest, 'created_at');
      });
  });

  describe('update flow', () => {
    before(async () => {
      creator = await testHelper.createUser({
        ...blueprints.users.creator,
        username: 'conversation_creator' });
      participant1 = await testHelper.createUser({
        ...blueprints.users.employee,
        username: 'conversation_participant1' });

      const network = await testHelper.createNetwork({ userId: creator.id });

      await testHelper.addUserToNetwork({ networkId: network.id, userId: participant1.id });
      await testHelper.addUserToNetwork({ networkId: network.id, userId: creator.id });
    });

    after(() => testHelper.cleanAll());

    it('should have different updatedAt after an update', async () => {
      const createdConversation = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant1.id],
      }, { credentials: creator });

      await Promise.delay(2000).then(() => privateMessageService.create({
        conversationId: createdConversation.id,
        text: 'First message',
      }, {
        credentials: participant1,
        artifacts: { authenticationToken: 'foo' },
      }));

      const updatedConversation = await conversationService.getConversation(createdConversation.id,
        {
          credentials: participant1,
          artifacts: { authenticationToken: 'foo' },
        });

      assert.isNotNull(createdConversation, 'updatedAt');
      assert.isNotNull(updatedConversation, 'updatedAt');
      assert.notEqual(createdConversation.updatedAt, updatedConversation.updatedAt);
    });
  });
});
