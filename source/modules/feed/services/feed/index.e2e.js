import { assert } from 'chai';
import moment from 'moment';
import R from 'ramda';
import Promise from 'bluebird';
import * as flexchangeService from '../../../flexchange/services/flexchange';
import * as objectService from '../object';
import * as commentService from '../comment';
import * as messageService from '../message';
import * as feedService from './index';

describe('Service: Feed', () => {
  describe.only('make', () => {
    let createdObject;
    let createdMessages;

    before(async () => {
      const serviceMessage = {
        credentials: { id: global.users.admin.id },
        network: { id: global.networks.flexAppeal.id },
      };

      const createdExchange = await flexchangeService.createExchange({
        date: moment().toISOString(),
        startTime: moment().toISOString(),
        endTime: moment().add(3, 'hours').toISOString(),
        type: 'ALL',
        values: [global.networks.flexAppeal.id],
      }, serviceMessage);

      const createdMessage1 = await messageService.create({
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
        text: 'Message for feed',
      }, serviceMessage);

      const createdMessage2 = await Promise.delay(1000)
        .then(() => messageService.create({
          parentType: 'network',
          parentId: global.networks.flexAppeal.id,
          text: 'Second message for feed',
        }, serviceMessage));

      const createdMessage3 = await Promise.delay(1000)
        .then(() => messageService.create({
          parentType: 'team',
          parentId: '33',
          text: 'Second message for other feed',
        }, serviceMessage));

      createdMessages = [createdMessage1, createdMessage2, createdMessage3];

      createdObject = await objectService.create({
        userId: global.users.admin.id,
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
        objectType: 'exchange',
        sourceId: createdExchange.id,
      });
    });

    after(async () => {
      await objectService.remove({ id: createdObject.id });
      await Promise.map(createdMessages, (m) => messageService.remove({ messageId: m.id }));
    });

    it('should return feed models in descending order by creation date', async () => {
      const actual = await feedService.make({
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
      }, {
        credentials: { id: global.users.admin.id },
        network: { id: global.networks.flexAppeal.id },
      });

      assert.lengthOf(actual, 3);
      assert.notProperty(actual[0], 'comments');
      assert.notProperty(actual[0], 'likes');
      assert.equal(actual[0].objectType, 'exchange');
      assert.equal(actual[0].parentType, 'network');
      assert.equal(actual[0].parentId, global.networks.flexAppeal.id);
      assert.equal(actual[1].objectType, 'feed_message');
      assert.equal(actual[1].source.text, 'Second message for feed');
      assert.equal(actual[2].objectType, 'feed_message');
      assert.equal(actual[2].source.text, 'Message for feed');
    });

    it('should return feed models for subset with limit and offset query', async () => {
      const actual = await feedService.make({
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
        offset: 1,
        limit: 1,
      }, {
        credentials: { id: global.users.admin.id },
        network: { id: global.networks.flexAppeal.id },
      });

      assert.lengthOf(actual, 1);
      assert.notProperty(actual[0], 'comments');
      assert.notProperty(actual[0], 'likes');
      assert.equal(actual[0].objectType, 'feed_message');
      assert.equal(actual[0].source.text, 'Second message for feed');
    });

    it('should include comments sub-resources via query parameter', async () => {
      await commentService.create({
        messageId: createdMessages[0].id,
        userId: global.users.admin.id,
        text: 'Cool comment as sub-resource',
      });

      const actual = await feedService.make({
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
        include: ['comments'],
      }, {
        credentials: { id: global.users.admin.id },
        network: { id: global.networks.flexAppeal.id },
      });

      const commentedMessage = R.find(R.propEq('sourceId', createdMessages[0].id), actual);
      const uncommentedMessage = R.find(R.propEq('sourceId', createdMessages[1].id), actual);

      assert.lengthOf(uncommentedMessage.comments, 0);
      assert.lengthOf(commentedMessage.comments, 1);
      assert.equal(commentedMessage.comments[0].messageId, createdMessages[0].id);
      assert.equal(commentedMessage.comments[0].userId, global.users.admin.id);
      assert.equal(commentedMessage.comments[0].text, 'Cool comment as sub-resource');
    });

    it('should include likes sub-resources via query parameter', async () => {
      await messageService.like({
        messageId: createdMessages[1].id,
        userId: global.users.admin.id,
      });

      const actual = await feedService.make({
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
        include: ['likes'],
      }, {
        credentials: { id: global.users.admin.id },
        network: { id: global.networks.flexAppeal.id },
      });

      const likedMessage = R.find(R.propEq('sourceId', createdMessages[1].id), actual);

      assert.lengthOf(likedMessage.likes, 1);
      assert.equal(likedMessage.likes[0].userId, global.users.admin.id);
    });

    it('should be able to include multiple sub-resources via query parameter', async () => {
      const actual = await feedService.make({
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
        include: ['likes', 'comments'],
      }, {
        credentials: { id: global.users.admin.id },
        network: { id: global.networks.flexAppeal.id },
      });

      const likedMessage = R.find(R.propEq('sourceId', createdMessages[1].id), actual);
      const commentedMessage = R.find(R.propEq('sourceId', createdMessages[0].id), actual);

      assert.lengthOf(likedMessage.likes, 1);
      assert.equal(likedMessage.likes[0].userId, global.users.admin.id);
      assert.equal(commentedMessage.comments[0].messageId, createdMessages[0].id);
      assert.equal(commentedMessage.comments[0].userId, global.users.admin.id);
      assert.equal(commentedMessage.comments[0].text, 'Cool comment as sub-resource');
    });
  });
});
