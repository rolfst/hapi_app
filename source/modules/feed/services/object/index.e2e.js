/* globals assert */
import * as testHelpers from '../../../../shared/test-utils/helpers';
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
        sourceId: '2',
      });

      await objectService.create({
        userId: admin.id,
        parentType: 'network',
        parentId: network.id,
        objectType: 'message',
        sourceId: '2',
      });
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
      assert.equal(actual[0].parentId, network.id);
      assert.equal(actual[1].userId, admin.id);
      assert.equal(actual[1].objectType, 'message');
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
      assert.equal(actual[0].objectType, 'message');
      assert.equal(actual[0].sourceId, '2');
      assert.equal(actual[0].parentType, 'network');
      assert.equal(actual[0].parentId, network.id);
    });
  });

  describe('count', () => {
    before(async () => {
      admin = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });

      await objectService.create({
        userId: admin.id,
        parentType: 'network',
        parentId: network.id,
        objectType: 'poll',
        sourceId: '2',
      });

      await objectService.create({
        userId: admin.id,
        parentType: 'network',
        parentId: network.id,
        objectType: 'message',
        sourceId: '2',
      });
    });

    after(() => testHelpers.cleanAll());

    it('should return correct count', async () => {
      const networkObjects = await objectService.count({ where: {
        parentType: 'network',
        parentId: network.id,
      } });

      assert.equal(networkObjects, 2);
    });
  });
});
