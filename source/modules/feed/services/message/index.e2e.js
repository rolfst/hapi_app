import { assert } from 'chai';
import * as testHelpers from '../../../../shared/test-utils/helpers';
import R from 'ramda';
import Promise from 'bluebird';
import * as pollService from '../../../poll/services/poll';
import * as messageService from './index';
import * as objectService from '../object';
import * as commentService from '../comment';

describe('Service: Message', () => {
  let admin;
  let employee;
  let network;

  describe('list', () => {
    let createdMessages = [];

    before(async () => {
      [admin, employee] = await Promise.all([
        testHelpers.createUser({ password: 'foo' }),
        testHelpers.createUser({ password: 'foo' }),
      ]);
      network = await testHelpers.createNetwork({ userId: admin.id });
      createdMessages = await Promise.all([
        messageService.create({
          parentType: 'network',
          parentId: network.id,
          text: 'My cool message',
          resources: [{
            type: 'poll',
            data: { options: ['Yes', 'No', 'Ok'] },
          }],
        }, {
          network,
          credentials: admin,
        }),
        messageService.create({
          parentType: 'network',
          parentId: network.id,
          text: 'My other cool message',
          resources: [],
        }, {
          network,
          credentials: admin,
        }),
      ]);
    });

    after(() => testHelpers.cleanAll());

    it('should return message models', async () => {
      const actual = await messageService.list({
        messageIds: R.pluck('sourceId', createdMessages),
      }, {
        credentials: admin,
      });

      assert.lengthOf(actual, 2);
      assert.property(actual[0], 'id');
      assert.property(actual[0], 'objectId');
      assert.property(actual[0], 'text');
      assert.property(actual[0], 'hasLiked');
      assert.property(actual[0], 'likesCount');
      assert.property(actual[0], 'commentsCount');
      assert.property(actual[0], 'createdAt');
    });

    it('should return correct like count', async () => {
      await Promise.all([
        messageService.like({
          messageId: createdMessages[0].sourceId, userId: admin.id }),
        messageService.like({
          messageId: createdMessages[0].sourceId, userId: employee.id }),
      ]);

      const actual = await messageService.list({
        messageIds: R.pluck('sourceId', createdMessages),
      }, {
        credentials: admin,
      });

      const likedMessage = R.find(R.propEq('id', createdMessages[0].sourceId), actual);
      const otherMessage = R.find(R.propEq('id', createdMessages[1].sourceId), actual);

      assert.lengthOf(actual, 2);
      assert.equal(likedMessage.likesCount, 2);
      assert.equal(likedMessage.hasLiked, true);
      assert.equal(likedMessage.commentsCount, 0);
      assert.equal(otherMessage.likesCount, 0);
      assert.equal(otherMessage.hasLiked, false);
      assert.equal(otherMessage.commentsCount, 0);
    });

    it('should return correct comment count', async () => {
      await commentService.create({
        messageId: createdMessages[1].sourceId,
        text: 'Foo comment for feed message!',
        userId: admin.id,
      });

      const actual = await messageService.list({
        messageIds: R.pluck('sourceId', createdMessages),
      }, {
        credentials: admin,
      });

      const commentedMessage = R.find(R.propEq('id', createdMessages[1].sourceId), actual);

      assert.lengthOf(actual, 2);
      assert.equal(commentedMessage.commentsCount, 1);
    });
  });

  describe('create', () => {
    let createdMessage;

    before(async () => {
      admin = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });

      createdMessage = await messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'My cool message',
        resources: [{
          type: 'poll',
          data: { options: ['Yes', 'No', 'Ok'] },
        }],
      }, { network, credentials: admin });
    });

    after(() => testHelpers.cleanAll());

    it('should return object with source after create', () => {
      assert.equal(createdMessage.userId, admin.id);
      assert.equal(createdMessage.objectType, 'feed_message');
      assert.equal(createdMessage.parentType, 'network');
      assert.equal(createdMessage.parentId, network.id);
      assert.equal(createdMessage.source.text, 'My cool message');
    });

    it('should create a message entry', async () => {
      const expected = await messageService.get({ messageId: createdMessage.sourceId });

      assert.isDefined(expected);
      assert.property(expected, 'objectId');
      assert.equal(expected.text, 'My cool message');
      assert.property(expected, 'createdAt');
    });

    it('should create a poll entry if resource is present', async () => {
      const objects = await objectService.list({
        parentType: 'feed_message',
        parentId: createdMessage.sourceId,
      });

      const pollEntry = await pollService.get({ pollId: objects[0].sourceId });

      assert.isDefined(pollEntry);
      assert.equal(pollEntry.networkId, network.id);
      assert.equal(pollEntry.userId, admin.id);
    });

    it('should create object entry for poll if resource is present', async () => {
      const expected = await objectService.list({
        parentType: 'feed_message',
        parentId: createdMessage.sourceId,
      });

      assert.lengthOf(expected, 1);
      assert.equal(expected[0].userId, admin.id);
      assert.equal(expected[0].objectType, 'poll');
      assert.isDefined(expected[0].sourceId);
    });

    xit('should create an attachment entry if resource is present', async () => {
      // TODO
    });

    xit('should create object entry for attachment if resource is present', async () => {
      // TODO
    });

    it('should create object entry for message', async () => {
      const objects = await objectService.list({
        parentType: 'network',
        parentId: network.id,
      });

      assert.equal(objects[0].sourceId, createdMessage.sourceId);
      assert.equal(objects[0].objectType, 'feed_message');
    });

    it('should fail when parent not found', async () => {
      const wrongMessagePromise = messageService.create({
        parentType: 'network',
        parentId: -1,
        text: 'My cool message',
        resources: [],
      }, { network, credentials: admin });

      return assert.isRejected(wrongMessagePromise, /Parent not found/);
    });
  });
});
