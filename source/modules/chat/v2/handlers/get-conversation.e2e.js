import { assert } from 'chai';
import * as testHelper from '../../../../shared/test-utils/helpers';
import Promise from 'bluebird';
import { getRequest } from '../../../../shared/test-utils/request';
import * as conversationService from '../services/conversation';

describe('Get conversation (v2)', () => {
  let creator;
  let participant1 = null;

  describe('Normal flow', () => {
    let conversation;

    before(async () => {
      [creator, participant1] = await Promise.all([
        testHelper.createUser(),
        testHelper.createUser(),
      ]);

      const network = await testHelper.createNetwork({ userId: creator.id });

      await testHelper.addUserToNetwork({ networkId: network.id, userId: participant1.id });
      await testHelper.addUserToNetwork({ networkId: network.id, userId: creator.id });

      conversation = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant1.id],
      }, { credentials: creator });
    });

    after(() => testHelper.cleanAll());

    it('should return conversation collection', async () => {
      const endpoint = `/v2/conversations/${conversation.id}`;
      const { result, statusCode } = await getRequest(endpoint, creator.token);
      const conversationUnderTest = result.data;

      assert.equal(statusCode, 200);
      assert.equal(conversationUnderTest.type, 'conversation');
      assert.equal(conversationUnderTest.id, conversation.id);
      assert.equal(conversationUnderTest.user_id, creator.id);
    });
  });

  describe('Not found', () => {
    before(async () => {
      creator = await testHelper.createUser();
      const network = await testHelper.createNetwork({ userId: creator.id });

      await testHelper.addUserToNetwork({ networkId: network.id, userId: creator.id });
    });

    after(() => testHelper.cleanAll());

    it('should return conversation collection', async () => {
      const { statusCode } = await getRequest('/v2/conversations/0', creator.token);

      assert.equal(statusCode, 404);
    });
  });
});
