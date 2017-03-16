const { assert } = require('chai');
const blueprints = require('../../../../shared/test-utils/blueprints');
const testHelper = require('../../../../shared/test-utils/helpers');
const { postRequest } = require('../../../../shared/test-utils/request');
const conversationRepo = require('../repositories/conversation');

describe('Handler: Create conversation (v2)', () => {
  let creator;
  let participant1;
  let participant2;
  let existingConversation;

  after(() => testHelper.cleanAll());

  describe('Good flow', () => {
    before(async () => {
      [creator, participant1, participant2] = await Promise.all([
        testHelper.createUser({ ...blueprints.users.employee,
          username: 'logged_user' }),
        testHelper.createUser({ ...blueprints.users.employee,
          username: 'conversation_participant1' }),
        testHelper.createUser({ ...blueprints.users.employee,
          username: 'conversation_participant2' }),
      ]);

      existingConversation = await conversationRepo.create({
        type: 'private',
        userId: creator.id,
        participantIds: [creator.id, participant2.id],
      });
    });

    after(() => conversationRepo.deleteById(existingConversation.id));

    it('should create a conversation with logged user and a participant', async () => {
      const ENDPOINT_URL = '/v2/conversations';
      const { result, statusCode } = await postRequest(ENDPOINT_URL, {
        type: 'private',
        participantIds: [participant1.id],
      }, creator.token);

      await conversationRepo.deleteById(result.data.id);

      assert.equal(statusCode, 200);
      assert.deepEqual(result.data.participant_ids, [participant1.id, creator.id]);
      assert.isTrue(result.is_new);
    });

    it('should return the existing conversation', async () => {
      const ENDPOINT_URL = '/v2/conversations';
      const { result, statusCode } = await postRequest(ENDPOINT_URL, {
        type: 'private',
        participantIds: [participant2.id],
      }, creator.token);

      assert.equal(statusCode, 200);
      assert.equal(existingConversation.id, result.data.id);
      assert.isFalse(result.is_new);
    });
  });

  describe('Bad flow', () => {
    before(async () => {
      creator = await testHelper.createUser({ ...blueprints.users.employee });
    });

    it('should fail when passing logged user as a participant', async () => {
      const ENDPOINT_URL = '/v2/conversations';
      const { statusCode } = await postRequest(ENDPOINT_URL, {
        type: 'private',
        participantIds: [creator.id],
      }, creator.token);

      assert.equal(statusCode, 422);
    });

    it('should fail when there are no participants', async () => {
      const ENDPOINT_URL = '/v2/conversations';
      const { statusCode } = await postRequest(ENDPOINT_URL, {
        type: 'private',
        participantIds: [],
      }, creator.token);

      assert.equal(statusCode, 422);
    });
  });
});
