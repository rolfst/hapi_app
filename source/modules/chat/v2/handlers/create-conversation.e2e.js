import { assert } from 'chai';
import blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import { postRequest } from '../../../../shared/test-utils/request';

describe('Handler: Create conversation (v2)', () => {
  let creator;
  let participant;

  describe('Good flow', () => {
    before(async () => {
      [creator, participant] = await Promise.all([
        testHelper.createUser({ ...blueprints.users.employee,
          username: 'logged_user' }),
        testHelper.createUser({ ...blueprints.users.employee,
          username: 'conversation_participant' }),
      ]);
    });

    after(() => testHelper.cleanAll());

    it('should return object model with new message as source', async () => {
      const ENDPOINT_URL = '/v2/conversations';
      const { result, statusCode } = await postRequest(ENDPOINT_URL, {
        type: 'private',
        participantIds: [participant.id],
      }, creator.token);

      assert.equal(statusCode, 200);
      assert.deepEqual(result.data.participant_ids, [participant.id, creator.id]);
    });
  });

  describe('Bad flow', () => {
    before(async () => {
      creator = await testHelper.createUser({ ...blueprints.users.employee });
    });

    after(() => testHelper.cleanAll());

    it('should return object model with new message as source', async () => {
      const ENDPOINT_URL = '/v2/conversations';
      const { statusCode } = await postRequest(ENDPOINT_URL, {
        type: 'private',
        participantIds: [creator.id],
      }, creator.token);

      assert.equal(statusCode, 422);
    });
  });
});
