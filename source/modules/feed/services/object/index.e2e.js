import { assert } from 'chai';
import * as serviceUnderTest from './index';

describe('Service: Object', () => {
  describe.only('listObjects', () => {
    before(async () => {
      await serviceUnderTest.create({
        userId: global.users.admin.id,
        parentType: 'network',
        parentId: '42',
        objectType: 'poll',
        sourceId: '2',
      });

      await serviceUnderTest.create({
        userId: global.users.admin.id,
        parentType: 'network',
        parentId: '42',
        objectType: 'message',
        sourceId: '2',
      });
    });

    it('should return objects', async () => {
      const actual = await serviceUnderTest.list({
        parentType: 'network',
        parentId: '42',
      }, { credentials: { id: global.users.admin.id } });

      assert.lengthOf(actual, 2);
    });
  });
});
