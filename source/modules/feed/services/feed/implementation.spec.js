import { assert } from 'chai';
import * as unitUnderTest from './implementation';

describe('Service: Object Implementation', () => {
  describe.only('flattenObjectTypeValues', () => {
    it('should return correct data', () => {
      const objects = [{
        id: '1',
        userId: '2',
        objectType: 'message',
        sourceId: '1',
        parentType: 'network',
        parentId: '42',
      }, {
        id: '2',
        userId: '2',
        objectType: 'message',
        sourceId: '2',
        parentType: 'network',
        parentId: '42',
      }, {
        id: '3',
        userId: '2',
        objectType: 'exchange',
        sourceId: '3',
        parentType: 'network',
        parentId: '42',
      }];

      const actual = unitUnderTest.flattenObjectTypeValues(objects);
      const expected = [{
        type: 'message',
        values: ['1', '2'],
      }, {
        type: 'exchange',
        values: ['3'],
      }];

      assert.deepEqual(actual, expected);
    });

    it('should return unique values', () => {
      const objects = [{
        id: '1',
        userId: '2',
        objectType: 'message',
        sourceId: '1',
        parentType: 'network',
        parentId: '42',
      }, {
        id: '2',
        userId: '2',
        objectType: 'message',
        sourceId: '1',
        parentType: 'network',
        parentId: '42',
      }];

      const actual = unitUnderTest.flattenObjectTypeValues(objects);
      const expected = [{
        type: 'message',
        values: ['1'],
      }];

      assert.deepEqual(actual, expected);
    });
  });
});
