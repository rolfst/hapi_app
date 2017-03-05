import { assert } from 'chai';
import stream from 'stream';
import sinon from 'sinon';
import { postRequest } from '../../../../shared/test-utils/request';
import * as Storage from '../../../../shared/services/storage';
import blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import * as attachmentService from '../../../attachment/services/attachment';
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
    const { result, statusCode } = await postRequest(ENDPOINT_URL, {
      text: 'My cool message',
    }, creator.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.object_type, 'private_message');
    assert.equal(result.data.parent_id, createdConversation.id);
    assert.equal(result.data.parent_type, 'conversation');
    assert.property(result.data, 'source');
    assert.equal(result.data.source.text, 'My cool message');
  });

  it('should handle file upload', async () => {
    sinon.stub(Storage, 'upload').returns(Promise.resolve('image.jpg'));
    const ENDPOINT_URL = `/v2/conversations/${createdConversation.id}/messages`;
    const attachment = await attachmentService.create({
      fileStream: new stream.Readable(),
    });

    const { result, statusCode } = await postRequest(ENDPOINT_URL, {
      text: 'My cool message',
      files: [attachment.id],
    }, creator.token);

    Storage.upload.restore();

    assert.equal(statusCode, 200);
    assert.equal(result.data.source.text, 'My cool message');
    assert.equal(result.data.children.length, 1);
    assert.equal(result.data.children[0].parent_id, result.data.source_id);
    assert.property(result.data.children[0], 'source');
    assert.equal(result.data.children[0].source.type, 'attachment');
    assert.equal(result.data.children[0].source.object_id, result.data.children[0].id);
    assert.equal(result.data.children[0].source.id, result.data.children[0].source_id);
    assert.property(result.data.children[0].source, 'path');
  });

  it('should throw error when providing invalid attachment ids', async () => {
    const ENDPOINT_URL = `/v2/conversations/${createdConversation.id}/messages`;
    const { result, statusCode } = await postRequest(ENDPOINT_URL, {
      text: 'My cool message',
      files: [-1],
    }, creator.token);

    assert.equal(statusCode, 403);
    assert.equal(result.detail, 'Please provide valid attachment ids');
  });
});
