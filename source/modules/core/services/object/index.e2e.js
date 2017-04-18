const { assert } = require('chai');
const R = require('ramda');
const Promise = require('bluebird');
const sinon = require('sinon');
const stream = require('stream');
const testHelpers = require('../../../../shared/test-utils/helpers');
const Storage = require('../../../../shared/services/storage');
const attachmentService = require('../../../attachment/services/attachment');
const conversationService = require('../../../chat/v2/services/conversation');
const privateMessageService = require('../../../chat/v2/services/private-message');
const feedMessageService = require('../../../feed/services/message');
const objectService = require('./index');

describe('Service: Object', () => {
  let admin;
  let network;
  let createdMessages;

  describe('list', () => {
    before(async () => {
      admin = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });

      const createdMessage1 = objectService.create({
        networkId: network.id,
        userId: admin.id,
        parentType: 'network',
        parentId: network.id,
        objectType: 'poll',
        sourceId: '1931',
      });

      const createdMessage2 = Promise.delay(1000).then(() => objectService.create({
        networkId: network.id,
        userId: admin.id,
        parentType: 'network',
        parentId: network.id,
        objectType: 'feed_message',
        sourceId: '1932',
      }));

      createdMessages = await Promise.all([createdMessage1, createdMessage2]);
    });

    after(() => testHelpers.cleanAll());

    it('should return objects', async () => {
      const actual = await objectService.list({
        parentType: 'network',
        parentId: network.id,
      }, { credentials: admin });

      assert.lengthOf(actual, 2);
      assert.equal(actual[0].objectType, 'feed_message');
      assert.equal(actual[0].sourceId, '1932');
      assert.equal(actual[0].parentType, 'network');
      assert.equal(actual[0].parentId, network.id);
      assert.equal(actual[1].userId, admin.id);
      assert.equal(actual[1].objectType, 'poll');
      assert.equal(actual[1].sourceId, '1931');
      assert.equal(actual[1].parentType, 'network');
    });

    it('should be able to paginate result', async () => {
      const actual = await objectService.list({
        parentType: 'network',
        parentId: network.id,
        limit: 1,
        offset: 1,
      }, { credentials: admin });

      assert.equal(actual[0].userId, admin.id);
      assert.equal(actual[0].objectType, 'poll');
      assert.equal(actual[0].sourceId, '1931');
      assert.equal(actual[0].parentType, 'network');
      assert.equal(actual[0].parentId, network.id);
    });

    it('should have a seenCount and should be 0', async () => {
      const actual = await objectService.list({
        parentType: 'network',
        parentId: network.id,
      }, { credentials: admin });

      const seenObjects = R.find(R.complement(R.propEq('seenCount', 0)), actual);

      assert.property(actual[0], 'seenCount', 'message 1 has seenCount property');
      assert.property(actual[1], 'seenCount', 'message 2 has seenCount property');

      assert.isUndefined(seenObjects, 'both messages should not have been seen');
    });

    it('one message should be read', async () => {
      // mark one message as read

      await objectService.markAsRead({
        ids: [createdMessages[0].id],
      }, { credentials: admin });

      const actual = await objectService.list({
        parentType: 'network',
        parentId: network.id,
      }, { credentials: admin });

      const seenMessage = R.find(R.propEq('id', createdMessages[0].id), actual);
      const unseenMessage = R.find(R.propEq('id', createdMessages[1].id), actual);

      assert.property(seenMessage, 'seen', 'seen message has seen property');
      assert.property(unseenMessage, 'seen', 'unseen message has seen property');

      assert.property(seenMessage, 'seenCount', 'seen message has seenCount property');
      assert.property(unseenMessage, 'seenCount', 'unseen message has seenCount property');

      assert.equal(seenMessage.seen, true, 'seen message has been seen by the current user');
      assert.equal(unseenMessage.seen, false, 'unseen message has not been seen by the current user');

      assert.equal(seenMessage.seenCount, 1, 'seen message is seen 1 time');
      assert.equal(unseenMessage.seenCount, 0, 'unseen message is seen 0 times');
    });
  });

  describe('count', () => {
    before(async () => {
      admin = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });

      return Promise.all([
        objectService.create({
          networkId: network.id,
          userId: admin.id,
          parentType: 'network',
          parentId: network.id,
          objectType: 'poll',
          sourceId: '39102',
        }),
        objectService.create({
          networkId: network.id,
          userId: admin.id,
          parentType: 'user',
          parentId: admin.id,
          objectType: 'poll',
          sourceId: '39102',
        }),
      ]);
    });

    after(() => testHelpers.cleanAll());

    it('should return correct count', async () => {
      const message = { credentials: admin };
      const [networkCount, userCount] = await Promise.all([
        objectService.count({ parentType: 'network', parentId: network.id }, message),
        objectService.count({ parentType: 'user', parentId: admin.id }, message),
      ]);

      assert.equal(R.sum([networkCount, userCount]), 2);
    });
  });

  describe('listWithSourceAndChildren', () => {
    before(async () => {
      admin = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });
    });

    after(() => testHelpers.cleanAll());

    it('should return children', async () => {
      sinon.stub(Storage, 'upload').returns(Promise.resolve('image.jpg'));
      const attachment = await attachmentService.create({
        fileStream: new stream.Readable(),
      });

      const createdMessageObject = await feedMessageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'Do you want to join us tomorrow?',
        files: [attachment.id],
      }, { network, credentials: admin });

      const createdMessageObject2 = await feedMessageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'Do you want to join us tomorrow?',
      }, { network, credentials: admin });

      const actual = await objectService.listWithSourceAndChildren({
        objectIds: [createdMessageObject.id, createdMessageObject2.id],
      }, { credentials: admin });

      await objectService.remove({ parentType: 'network', parentId: '42' });
      await objectService.remove({
        parentType: 'feed_message', parentId: createdMessageObject.sourceId });

      const objectWithChildren = R.find(R.propEq('id', createdMessageObject.id), actual);
      const objectWithoutChildren = R.find(R.propEq('id', createdMessageObject2.id), actual);

      Storage.upload.restore();

      assert.lengthOf(actual, 2);
      assert.deepEqual(objectWithoutChildren.children, []);
      assert.property(objectWithChildren, 'children');
      assert.lengthOf(objectWithChildren.children, 1);
      assert.equal(objectWithChildren.children[0].parentType, 'feed_message');
      assert.equal(objectWithChildren.children[0].parentId, createdMessageObject.sourceId);
      assert.equal(objectWithChildren.children[0].source.type, 'attachment');
    });

    it('should support object_type: private_message', async () => {
      const participant = await testHelpers.createUser({ password: 'foo' });
      const createdConversation = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [admin.id, participant.id],
      }, { credentials: admin });

      const createdMessageObject = await privateMessageService.create({
        conversationId: createdConversation.id,
        text: 'Test message',
      }, {
        credentials: admin,
        artifacts: { authenticationToken: 'FOO_TOKEN' },
      });

      const actual = await objectService.listWithSourceAndChildren({
        objectIds: [createdMessageObject.id],
      }, { credentials: admin });

      const object = actual[0];

      assert.equal(object.source.type, 'private_message');
      assert.equal(object.source.id, createdMessageObject.source.id);
      assert.equal(object.source.text, 'Test message');
    });

    it('should support object_type: feed_message', async () => {
      const createdMessageObject = await feedMessageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'Test message for network',
      }, { network, credentials: admin });

      const actual = await objectService.listWithSourceAndChildren({
        objectIds: [createdMessageObject.id],
      }, { network, credentials: admin });

      const object = actual[0];

      assert.equal(object.source.type, 'feed_message');
      assert.equal(object.source.id, createdMessageObject.sourceId);
      assert.equal(object.source.text, 'Test message for network');
    });
  });
});
