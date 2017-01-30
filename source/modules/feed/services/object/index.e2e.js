import { assert } from 'chai';
import R from 'ramda';
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
        objectType: 'feed_message',
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
    before(() => Promise.all([
      objectService.create({
        userId: global.users.admin.id,
        parentType: 'network',
        parentId: '123',
        objectType: 'poll',
        sourceId: '3',
      }),
      objectService.create({
        userId: global.users.admin.id,
        parentType: 'network',
        parentId: '123',
        objectType: 'feed_message',
        sourceId: '2',
      }),
    ]));

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

    it.only('should return children', async () => {
      const createdMessage = await feedMessageService.create({
        parentType: 'network',
        parentId: '42',
        text: 'Do you want to join us tomorrow?',
        resources: [{
          type: 'poll',
          data: { options: ['Yes', 'No', 'Ok'] },
        }],
      }, {
        credentials: global.users.admin,
        network: { id: '42' },
      });

      const actual = await objectService.listWithSources({
        objectIds: [createdMessage.objectId],
      }, { credentials: { id: global.users.admin.id } });

      await objectService.remove({ parentType: 'network', parentId: '42' });
      await objectService.remove({ parentType: 'feed_message', parentId: createdMessage.id });

      const objectWithChild = R.find(R.propEq('parentType', 'message'), actual);
      console.log(objectWithChild);

      assert.lengthOf(actual, 2);
      assert.property(objectWithChild, 'children');
      assert.lengthOf(objectWithChild.children, 1);
      assert.equal(objectWithChild.children[0].type, 'poll');
      assert.equal(objectWithChild.children[0].id, '20');
    });

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
