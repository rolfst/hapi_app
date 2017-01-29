import { assert } from 'chai';
import * as objectService from './index';

describe('Service: Object', () => {
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

    after(() => objectService.remove({ parentType: 'network', parentId: '42' }));

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
});
