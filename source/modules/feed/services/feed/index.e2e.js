import { assert } from 'chai';
import moment from 'moment';
import sinon from 'sinon';
import R from 'ramda';
import Promise from 'bluebird';
import * as testHelpers from '../../../../shared/test-utils/helpers';
import * as notifier from '../../../../shared/services/notifier';
import * as flexchangeService from '../../../flexchange/services/flexchange';
import * as commentService from '../comment';
import * as messageService from '../message';
import * as feedService from './index';

describe('Service: Feed', () => {
  describe('make', () => {
    let sandbox;
    let network;
    let admin;
    let createdMessages;
    let createdExchange;

    before(async () => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(notifier, 'send');
      admin = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });

      await testHelpers.addUserToNetwork({ userId: admin.id, networkId: network.id });

      const serviceMessage = {
        credentials: { id: admin.id },
        network: { id: network.id },
      };

      const createdMessage1 = await Promise.delay(1000)
        .then(() => messageService.create({
          parentType: 'network',
          parentId: network.id,
          text: 'Message for feed',
        }, serviceMessage));

      const createdMessage2 = await Promise.delay(1000)
        .then(() => messageService.create({
          parentType: 'network',
          parentId: network.id,
          text: 'Second message for feed',
        }, serviceMessage));

      const createdMessage3 = await Promise.delay(1000)
        .then(() => messageService.create({
          parentType: 'team',
          parentId: '33',
          text: 'Second message for other feed',
        }, serviceMessage));

      createdExchange = await Promise.delay(1000)
        .then(() => flexchangeService.createExchange({
          date: moment().toISOString(),
          startTime: moment().toISOString(),
          endTime: moment().add(3, 'hours').toISOString(),
          type: 'ALL',
          values: [network.id],
        }, serviceMessage));

      await Promise.delay(1000); // We wait here for the EventEmitter actions to finish

      createdMessages = [createdMessage1, createdMessage2, createdMessage3];
    });

    after(() => {
      sandbox.restore();
      return testHelpers.cleanAll();
    });

    it('should return feed models in descending order by creation date', async () => {
      const actual = await feedService.make({
        parentType: 'network',
        parentId: network.id,
      }, {
        credentials: { id: admin.id },
        network: { id: network.id },
      });

      assert.lengthOf(actual, 3);
      assert.notProperty(actual[0], 'comments');
      assert.notProperty(actual[0], 'likes');
      assert.equal(actual[0].objectType, 'exchange');
      assert.equal(actual[0].parentType, 'user');
      assert.equal(actual[0].parentId, admin.id);
      assert.equal(actual[0].sourceId, createdExchange.id);
      assert.equal(actual[1].objectType, 'feed_message');
      assert.equal(actual[1].source.text, 'Second message for feed');
      assert.equal(actual[2].objectType, 'feed_message');
      assert.equal(actual[2].source.text, 'Message for feed');
    });

    it('should return feed models for subset with limit and offset query', async () => {
      const actual = await feedService.make({
        parentType: 'network',
        parentId: network.id,
        offset: 1,
        limit: 2,
      }, {
        credentials: { id: admin.id },
        network: { id: network.id },
      });

      assert.lengthOf(actual, 2);
      assert.equal(actual[0].objectType, 'exchange');
      assert.equal(actual[0].parentType, 'user');
      assert.equal(actual[0].parentId, admin.id);
      assert.equal(actual[0].sourceId, createdExchange.id);
      assert.notProperty(actual[1], 'comments');
      assert.notProperty(actual[1], 'likes');
      assert.equal(actual[1].objectType, 'feed_message');
      assert.equal(actual[1].source.text, 'Second message for feed');
    });

    it('should include comments sub-resources via query parameter', async () => {
      await commentService.create({
        messageId: createdMessages[0].id,
        userId: admin.id,
        text: 'Cool comment as sub-resource',
      });

      const actual = await feedService.make({
        parentType: 'network',
        parentId: network.id,
        include: ['comments'],
      }, {
        credentials: { id: admin.id },
        network: { id: network.id },
      });

      const commentedMessage = R.find(R.propEq('sourceId', createdMessages[0].id), actual);
      const uncommentedMessage = R.find(R.propEq('sourceId', createdMessages[1].id), actual);

      assert.lengthOf(uncommentedMessage.comments, 0);
      assert.lengthOf(commentedMessage.comments, 1);
      assert.equal(commentedMessage.comments[0].messageId, createdMessages[0].id);
      assert.equal(commentedMessage.comments[0].userId, admin.id);
      assert.equal(commentedMessage.comments[0].text, 'Cool comment as sub-resource');
    });

    it('should include likes sub-resources via query parameter', async () => {
      await messageService.like({
        messageId: createdMessages[1].id,
        userId: admin.id,
      });

      const actual = await feedService.make({
        parentType: 'network',
        parentId: network.id,
        include: ['likes'],
      }, {
        credentials: { id: admin.id },
        network: { id: network.id },
      });

      const likedMessage = R.find(R.propEq('sourceId', createdMessages[1].id), actual);

      assert.lengthOf(likedMessage.likes, 1);
      assert.equal(likedMessage.likes[0].userId, admin.id);
    });

    it('should be able to include multiple sub-resources via query parameter', async () => {
      const actual = await feedService.make({
        parentType: 'network',
        parentId: network.id,
        include: ['likes', 'comments'],
      }, {
        credentials: { id: admin.id },
        network: { id: network.id },
      });

      const likedMessage = R.find(R.propEq('sourceId', createdMessages[1].id), actual);
      const commentedMessage = R.find(R.propEq('sourceId', createdMessages[0].id), actual);

      assert.lengthOf(likedMessage.likes, 1);
      assert.equal(likedMessage.likes[0].userId, admin.id);
      assert.equal(commentedMessage.comments[0].messageId, createdMessages[0].id);
      assert.equal(commentedMessage.comments[0].userId, admin.id);
      assert.equal(commentedMessage.comments[0].text, 'Cool comment as sub-resource');
    });
  });
});
