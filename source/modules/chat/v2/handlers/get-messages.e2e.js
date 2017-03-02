import { assert } from 'chai';
import sinon from 'sinon';
import Promise from 'bluebird';
import stream from 'stream';
import blueprints from '../../../../shared/test-utils/blueprints';
import * as testHelper from '../../../../shared/test-utils/helpers';
import { getRequest } from '../../../../shared/test-utils/request';
import * as Storage from '../../../../shared/services/storage';
import * as attachmentService from '../../../attachment/services/attachment';
import * as privateMessageService from '../services/private-message';
import * as conversationService from '../services/conversation';

describe('Handler: Get messages (v2)', () => {
  let sandbox;
  let createdConversation;
  let creator;

  before(async () => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(Storage, 'upload').returns(Promise.resolve('image.jpg'));
    const [admin, participant] = await Promise.all([
      testHelper.createUser({
        ...blueprints.users.admin,
        username: 'conversation_creator' }),
      testHelper.createUser({
        ...blueprints.users.employee,
        username: 'conversation_participant' }),
    ]);
    creator = admin;

    const network = await testHelper.createNetwork({ userId: creator.id });

    await Promise.all([
      testHelper.addUserToNetwork({ networkId: network.id, userId: participant.id }),
      testHelper.addUserToNetwork({ networkId: network.id, userId: creator.id }),
    ]);

    const attachment = await attachmentService.create({
      fileStream: new stream.Readable(),
    });

    createdConversation = await conversationService.create({
      type: 'PRIVATE',
      participantIds: [creator.id, participant.id],
    }, { credentials: creator });

    await privateMessageService.create({
      conversationId: createdConversation.id,
      text: 'First message',
    }, {
      credentials: participant,
      artifacts: { authenticationToken: 'foo' },
    });

    await Promise.delay(1000).then(() => privateMessageService.create({
      conversationId: createdConversation.id,
      text: 'Second message',
      files: [attachment.id],
    }, {
      credentials: participant,
      artifacts: { authenticationToken: 'foo' },
    }));

    await Promise.delay(1000).then(() => privateMessageService.create({
      conversationId: createdConversation.id,
      text: 'Last message',
    }, {
      credentials: participant,
      artifacts: { authenticationToken: 'foo' },
    }));

    Storage.upload.restore();
  });

  after(() => {
    sandbox.restore();
    return testHelper.cleanAll();
  });

  it('should return messages for conversation (v2)', async () => {
    const endpoint = `/v2/conversations/${createdConversation.id}/messages`;
    const { result, statusCode } = await getRequest(endpoint, creator.token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 3);
    assert.equal(result.data[0].source.type, 'private_message');
    assert.isString(result.data[0].source.id);
    assert.equal(result.data[0].source.text, 'Last message');
    assert.property(result.data[0], 'created_at');
    assert.equal(result.data[0].children.length, 0);
    assert.equal(result.data[1].source.text, 'Second message');
    assert.equal(result.data[1].children.length, 1);
    assert.equal(result.data[2].source.text, 'First message');
    assert.equal(result.data[2].children.length, 0);
    assert.property(result, 'meta');
    assert.property(result.meta.pagination, 'offset');
    assert.property(result.meta.pagination, 'limit');
    assert.property(result.meta.pagination, 'total_count');
    assert.equal(result.meta.pagination.total_count, 3);
  });

  it('should return messages for conversation limited by 2', async () => {
    const endpoint = `/v2/conversations/${createdConversation.id}/messages?limit=2`;
    const { result, statusCode } = await getRequest(endpoint, creator.token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 2);
    assert.equal(result.meta.pagination.total_count, 3);
    assert.equal(result.data[0].source.type, 'private_message');
    assert.isString(result.data[0].source.id);
    assert.equal(result.data[0].source.text, 'Last message');
    assert.property(result.data[0], 'created_at');
    assert.equal(result.data[1].source.text, 'Second message');
  });

  it('should return messages for conversation limited by 2 starting from the second message',
  async () => {
    const endpoint = `/v2/conversations/${createdConversation.id}/messages?limit=2&offset=1`;
    const { result, statusCode } = await getRequest(endpoint, creator.token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 2);
    assert.equal(result.meta.pagination.total_count, 3);
    assert.equal(result.data[0].source.type, 'private_message');
    assert.isString(result.data[0].source.id);
    assert.equal(result.data[0].source.text, 'Second message');
    assert.property(result.data[0], 'created_at');
    assert.equal(result.data[1].source.text, 'First message');
  });

  it('should return 404 code when conversation does not exist', async () => {
    const endpoint = '/v2/conversations/93523423423/messages';
    const { statusCode } = await getRequest(endpoint, creator.token);

    assert.equal(statusCode, 404);
  });
});
