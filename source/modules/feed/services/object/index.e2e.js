import { assert } from 'chai';
import R from 'ramda';
import * as testHelpers from '../../../../shared/test-utils/helpers';
import * as conversationService from '../../../chat/v2/services/conversation';
import * as privateMessageService from '../../../chat/v2/services/private-message';
import * as feedMessageService from '../message';
import * as objectService from './index';

describe('Service: Object', () => {
  let admin;
  let network;

  describe('list', () => {
    before(async () => {
      admin = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });

      await objectService.create({
        userId: admin.id,
        parentType: 'network',
        parentId: network.id,
        objectType: 'poll',
        sourceId: '1931',
      });

      await objectService.create({
        userId: admin.id,
        parentType: 'network',
        parentId: network.id,
        objectType: 'feed_message',
        sourceId: '1932',
      });
    });

    after(() => testHelpers.cleanAll());

    it('should return objects', async () => {
      const actual = await objectService.list({
        parentType: 'network',
        parentId: network.id,
      }, { credentials: admin });

      assert.lengthOf(actual, 2);
      assert.equal(actual[0].userId, admin.id);
      assert.equal(actual[0].objectType, 'poll');
      assert.equal(actual[0].sourceId, '1931');
      assert.equal(actual[0].parentType, 'network');
      assert.equal(actual[1].objectType, 'feed_message');
      assert.equal(actual[1].sourceId, '1932');
      assert.equal(actual[1].parentType, 'network');
      assert.equal(actual[1].parentId, network.id);
    });

    it('should be able to paginate result', async () => {
      const actual = await objectService.list({
        parentType: 'network',
        parentId: network.id,
        limit: 1,
        offset: 1,
      }, { credentials: admin });

      assert.lengthOf(actual, 1);
      assert.equal(actual[0].userId, admin.id);
      assert.equal(actual[0].objectType, 'feed_message');
      assert.equal(actual[0].sourceId, '1932');
      assert.equal(actual[0].parentType, 'network');
      assert.equal(actual[0].parentId, network.id);
    });
  });

  describe('count', () => {
    before(async () => {
      admin = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });

      return Promise.all([
        objectService.create({
          userId: admin.id,
          parentType: 'network',
          parentId: network.id,
          objectType: 'poll',
          sourceId: '39102',
        }),
        objectService.create({
          userId: admin.id,
          parentType: 'network',
          parentId: network.id,
          objectType: 'feed_message',
          sourceId: '39102',
        }),
      ]);
    });

    it('should return correct count', async () => {
      const networkObjects = await objectService.count({ where: {
        parentType: 'network',
        parentId: network.id,
      } });

      assert.equal(networkObjects, 2);
    });
  });

  describe('listWithSourceAndChildren', () => {
    before(async () => {
      admin = await testHelpers.createUser({ password: 'foo' });
    });

    after(() => testHelpers.cleanAll());

    it('should return children', async () => {
      const createdMessageObject = await feedMessageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'Do you want to join us tomorrow?',
        poll: { options: ['Yes', 'No', 'Ok'] },
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

      assert.lengthOf(actual, 2);
      assert.deepEqual(objectWithoutChildren.children, []);
      assert.property(objectWithChildren, 'children');
      assert.lengthOf(objectWithChildren.children, 1);
      assert.equal(objectWithChildren.children[0].parentType, 'feed_message');
      assert.equal(objectWithChildren.children[0].parentId, createdMessageObject.sourceId);
      assert.equal(objectWithChildren.children[0].source.type, 'poll');
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
