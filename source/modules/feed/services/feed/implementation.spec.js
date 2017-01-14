import { assert } from 'chai';
import R from 'ramda';
import sinon from 'sinon';
import Promise from 'bluebird';
import * as flexchangeService from '../../../flexchange/services/flexchange';
import * as messageService from '../message';
import * as unitUnderTest from './implementation';

describe('Service: Object Implementation', () => {
  describe('createObjectSourceLinks', () => {
    it('should return correct data', () => {
      const objects = [{
        id: '10',
        userId: '2',
        objectType: 'message',
        sourceId: '1',
        parentType: 'network',
        parentId: '42',
      }, {
        id: '20',
        userId: '2',
        objectType: 'message',
        sourceId: '2',
        parentType: 'network',
        parentId: '42',
      }, {
        id: '30',
        userId: '2',
        objectType: 'exchange',
        sourceId: '3',
        parentType: 'network',
        parentId: '42',
      }];

      const actual = unitUnderTest.createObjectSourceLinks(objects);
      const expected = [{
        type: 'message',
        values: [{
          objectId: '10',
          sourceId: '1',
        }, {
          objectId: '20',
          sourceId: '2',
        }],
      }, {
        type: 'exchange',
        values: [{
          objectId: '30',
          sourceId: '3',
        }],
      }];

      assert.deepEqual(actual, expected);
    });
  });

  describe('findSourcesForFeed', () => {
    it('should merge result the correct type', async () => {
      const flattenedObjects = [{
        type: 'message',
        values: ['1', '2'],
      }, {
        type: 'exchange',
        values: ['13', '14'],
      }];

      sinon.stub(messageService, 'list').returns(Promise.resolve([{
        id: '1',
        text: 'Foo text',
      }, {
        id: '2',
        text: 'Foo other text',
      }]));

      sinon.stub(flexchangeService, 'list').returns(Promise.resolve([{
        id: '13',
        description: 'Blabla',
      }, {
        id: '14',
        description: 'Blabla',
      }]));

      const promisedSources = R.map(unitUnderTest.findSourcesForFeed({}), flattenedObjects);
      const actual = await Promise.map(promisedSources, Promise.props);

      assert.deepEqual(actual, [{
        type: 'message',
        values: [{ id: '1', text: 'Foo text' }, { id: '2', text: 'Foo other text' }],
      }, {
        type: 'exchange',
        values: [{ id: '13', description: 'Blabla' }, { id: '14', description: 'Blabla' }],
      }]);
    });
  });
});
