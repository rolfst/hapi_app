import { assert } from 'chai';
import { putRequest } from '../../../shared/test-utils/request';
import * as testHelpers from '../../../shared/test-utils/helpers';
import * as messageService from '../services/message';

describe('Handler: Update Message', () => {
  let admin;
  let createdMessages = [];

  before(async () => {
    admin = await testHelpers.createUser({ password: 'foo' });

    const network = await testHelpers.createNetwork({ userId: admin.id });
    createdMessages = await Promise.all([
      messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'My cool message',
        resources: [{
          type: 'poll',
          data: { options: ['Yes', 'No', 'Ok'] },
        }],
      }, {
        network,
        credentials: admin,
      }),
      messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'My other cool message',
        resources: [],
      }, {
        network,
        credentials: admin,
      }),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should update a message', async () => {
    const { result } = await putRequest(`/v3/messages/${createdMessages[0].id}`,
        { text: 'My cool updated message' }, admin.token);

    assert.equal(result.data.text, 'My cool updated message');
  });
});
