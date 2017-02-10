import { assert } from 'chai';
import * as impl from './implementation';

describe('Service: Object Implementation', () => {
  describe('findChildren', () => {
    it('should work', () => {
      const objectsWithSource = [{
        id: '752',
        userId: '7055',
        objectType: 'feed_message',
        sourceId: '643',
        parentType: 'network',
        parentId: '42',
        createdAt: '2017-02-09T11:14:34.000Z',
        source: { foo: 'bar' },
      }, {
        id: '794',
        userId: '1532',
        objectType: 'poll',
        sourceId: '234',
        parentType: 'feed_message',
        parentId: '643',
        createdAt: '2017-02-09T11:14:34.000Z',
        source: { bar: 'foo' },
      }];

      const actual = impl.findChildren(objectsWithSource, objectsWithSource[0]);

      assert.deepEqual(actual, [{
        id: '794',
        userId: '1532',
        objectType: 'poll',
        sourceId: '234',
        parentType: 'feed_message',
        parentId: '643',
        createdAt: '2017-02-09T11:14:34.000Z',
        source: { bar: 'foo' },
      }]);
    });
  });
});
