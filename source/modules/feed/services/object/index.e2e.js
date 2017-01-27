import { assert } from 'chai';
import * as privateMessageService from '../../../chat/v2/services/private-message';
import * as feedMessageService from '../message';
import * as objectService from './index';

describe('Service: Object', () => {
  after(() => objectService.remove({ parentType: 'network', parentId: '42' }));

  describe('list', () => {
    before(async () => {
      await objectService.create({
        userId: global.users.admin.id,
        parentType: 'network',
        parentId: '42',
        objectType: 'poll',
        sourceId: '2',
      });

      await objectService.create({
        userId: global.users.admin.id,
        parentType: 'network',
        parentId: '42',
        objectType: 'message',
        sourceId: '2',
      });
    });

    it('should return objects', async () => {
      const actual = await objectService.list({
        parentType: 'network',
        parentId: '42',
      }, { credentials: { id: global.users.admin.id } });

      assert.lengthOf(actual, 2);
      assert.equal(actual[0].userId, global.users.admin.id);
      assert.equal(actual[0].objectType, 'poll');
      assert.equal(actual[0].sourceId, '2');
      assert.equal(actual[0].parentType, 'network');
      assert.equal(actual[0].parentId, '42');
      assert.equal(actual[1].userId, global.users.admin.id);
      assert.equal(actual[1].objectType, 'message');
      assert.equal(actual[1].sourceId, '2');
      assert.equal(actual[1].parentType, 'network');
      assert.equal(actual[1].parentId, '42');
    });

    it('should be able to paginate result', async () => {
      const actual = await objectService.list({
        parentType: 'network',
        parentId: '42',
        limit: 1,
        offset: 1,
      }, { credentials: { id: global.users.admin.id } });

      assert.lengthOf(actual, 1);
      assert.equal(actual[0].userId, global.users.admin.id);
      assert.equal(actual[0].objectType, 'message');
      assert.equal(actual[0].sourceId, '2');
      assert.equal(actual[0].parentType, 'network');
      assert.equal(actual[0].parentId, '42');
    });
  });

  describe('count', () => {
    before(async () => {
      await objectService.create({
        userId: global.users.admin.id,
        parentType: 'network',
        parentId: '42',
        objectType: 'poll',
        sourceId: '2',
      });

      await objectService.create({
        userId: global.users.admin.id,
        parentType: 'network',
        parentId: '42',
        objectType: 'message',
        sourceId: '2',
      });
    });

    after(() => objectService.remove({ parentType: 'network', parentId: '42' }));

    it('should return correct count', async () => {
      const networkObjects = await objectService.count({ where: {
        parentType: 'network',
        parentId: '42',
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
      }, { credentials: { id: global.users.admin.id } });

      const actual = await objectService.listWithSources({
        objectIds: [createdMessage.objectId],
      }, { credentials: { id: global.users.admin.id } });

      const object = actual[0];

      assert.equal(object.source.type, 'private_message');
      assert.equal(object.source.id, createdMessage.id);
      assert.equal(object.source.text, 'Test message');
    });

    it('should support object_type: feed_message', async () => {
      const createdMessage = await feedMessageService.create({
        parentType: 'network',
        parentId: '42',
        text: 'Test message for network',
      }, { credentials: { id: global.users.admin.id } });

      const actual = await objectService.listWithSources({
        objectIds: [createdMessage.objectId],
      }, { credentials: { id: global.users.admin.id } });

      const object = actual[0];

      assert.equal(object.source.type, 'feed_message');
      assert.equal(object.source.id, createdMessage.id);
      assert.equal(object.source.text, 'Test message for network');
    });
  });
});
