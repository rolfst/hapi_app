import { assert } from 'chai';
import FormData from 'form-data';
import streamToPromise from 'stream-to-promise';
import sinon from 'sinon';
import * as Storage from '../../../../shared/services/storage';
import blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import * as conversationService from '../services/conversation';

describe('Handler: Create message (v2)', () => {
  let createdConversation;
  let creator;

  before(async () => {
    const [admin, participant] = await Promise.all([
      testHelper.createUser({
        ...blueprints.users.employee,
        username: 'conversation_creator' }),
      testHelper.createUser({
        ...blueprints.users.employee,
        username: 'conversation_participant' }),
    ]);
    creator = admin;

    await testHelper.createNetwork({ userId: creator.id, name: 'flexappeal' });

    createdConversation = await conversationService.create({
      type: 'PRIVATE',
      participantIds: [creator.id, participant.id],
    }, { credentials: { id: creator.id } });
  });

  after(() => testHelper.cleanAll());

  it('should return object model with new message as source', async () => {
    const ENDPOINT_URL = `/v2/conversations/${createdConversation.id}/messages`;
    const formData = new FormData();
    formData.append('text', 'My cool message');

    const payload = await streamToPromise(formData);
    const { result, statusCode } = await global.server.inject({
      payload,
      method: 'POST',
      url: ENDPOINT_URL,
      headers: {
        ...formData.getHeaders(),
        'X-API-Token': creator.token,
      },
    });

    assert.equal(statusCode, 200);
    assert.equal(result.data.object_type, 'private_message');
    assert.equal(result.data.parent_id, createdConversation.id);
    assert.equal(result.data.parent_type, 'conversation');
    assert.property(result.data, 'source');
    assert.equal(result.data.source.text, 'My cool message');
  });

  it('should handle file upload', async () => {
    const hapiFile = testHelper.hapiFile('image.jpg');
    sinon.stub(Storage, 'upload').returns(Promise.resolve('image.jpg'));

    const ENDPOINT_URL = `/v2/conversations/${createdConversation.id}/messages`;
    const formData = new FormData();
    formData.append('text', 'My cool message');
    formData.append('attachments', JSON.stringify(hapiFile));

    const payload = await streamToPromise(formData);

    const { result, statusCode } = await global.server.inject({
      payload,
      method: 'POST',
      url: ENDPOINT_URL,
      headers: {
        ...formData.getHeaders(),
        'X-API-Token': creator.token,
      },
    });

    Storage.upload.restore();

    assert.equal(statusCode, 200);
    assert.equal(result.data.source.text, 'My cool message');
    assert.equal(result.data.children.length, 1);
  });
});
