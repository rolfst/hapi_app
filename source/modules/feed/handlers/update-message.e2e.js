const { assert } = require('chai');
const { putRequest } = require('../../../shared/test-utils/request');
const testHelpers = require('../../../shared/test-utils/helpers');
const messageService = require('../services/message');

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
        question: 'Will we help?',
        pollOptions: ['Yes', 'No', 'Ok'],
      }, {
        network,
        credentials: admin,
      }),
      messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'My other cool message',
      }, {
        network,
        credentials: admin,
      }),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should update a message', async () => {
    const { result } = await putRequest(`/v3/messages/${createdMessages[0].source.id}`,
        { text: 'My cool updated message' }, admin.token);

    assert.equal(result.data.source.text, 'My cool updated message');
  });
});
