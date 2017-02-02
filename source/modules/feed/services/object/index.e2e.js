import * as testHelpers from '../../../../shared/test-utils/helpers';
import { assert } from 'chai';
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

      return Promise.all([
        objectService.create({
          userId: admin.id,
          parentType: 'network',
          parentId: network.id,
          objectType: 'poll',
          sourceId: '2',
        }),
        objectService.create({
          userId: admin.id,
          parentType: 'network',
          parentId: network.id,
          objectType: 'feed_message',
          sourceId: '2',
        }),
      ]);
    });

    after(() => testHelpers.cleanAll());

    it('should return objects', async () => {
      const actual = await objectService.list({
        parentType: 'network',
        parentId: network.id,
      }, { credentials: { id: admin.id } });

      assert.lengthOf(actual, 2);
      assert.equal(actual[0].userId, admin.id);
      assert.equal(actual[0].objectType, 'poll');
      assert.equal(actual[0].sourceId, '2');
      assert.equal(actual[0].parentType, 'network');
      assert.equal(actual[1].objectType, 'feed_message');
      assert.equal(actual[1].sourceId, '2');
      assert.equal(actual[1].parentType, 'network');
      assert.equal(actual[1].parentId, network.id);
    });

    it('should be able to paginate result', async () => {
      const actual = await objectService.list({
        parentType: 'network',
        parentId: network.id,
        limit: 1,
        offset: 1,
      }, { credentials: { id: admin.id } });

      assert.lengthOf(actual, 1);
      assert.equal(actual[0].userId, admin.id);
      assert.equal(actual[0].objectType, 'feed_message');
      assert.equal(actual[0].sourceId, '2');
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
          parentId: '123',
          objectType: 'poll',
          sourceId: '3',
        }),
        objectService.create({
          userId: admin.id,
          parentType: 'network',
          parentId: '123',
          objectType: 'feed_message',
          sourceId: '3',
        }),
      ]);
    });

    it('should return correct count', async () => {
      const networkObjects = await objectService.count({ where: {
        parentType: 'network',
        parentId: '123',
      } });

      assert.equal(networkObjects, 2);
    });
  });

  describe('listWithSources', () => {
    after(() => objectService.remove({ parentType: 'conversation', parentId: '42' }));

    it('should support object_type: private_message', async () => {
      const createdMessage = await privateMessageService.create({
        conversationId: '42',
        text: 'Test message',
      }, { credentials: { id: admin.id } });

      const actual = await objectService.listWithSources({
        objectIds: [createdMessage.id],
      }, { credentials: { id: admin.id } });

      const object = actual[0];

      assert.equal(object.source.type, 'private_message');
      assert.equal(object.source.id, createdMessage.source.id);
      assert.equal(object.source.text, 'Test message');
    });

    it('should support object_type: feed_message', async () => {
      const createdMessage = await feedMessageService.create({
        parentType: 'network',
        parentId: '42',
        text: 'Test message for network',
      }, { credentials: { id: admin.id } });

      const actual = await objectService.listWithSources({
        objectIds: [createdMessage.objectId],
      }, { credentials: { id: admin.id } });

      const object = actual[0];

      assert.equal(object.source.type, 'feed_message');
      assert.equal(object.source.id, createdMessage.id);
      assert.equal(object.source.text, 'Test message for network');
    });
  });
});
