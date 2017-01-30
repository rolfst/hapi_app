import { assert } from 'chai';
import R from 'ramda';
import Promise from 'bluebird';
import * as pollService from '../../../poll/services/poll';
import * as messageService from './index';
import * as objectService from '../object';
import * as commentService from '../comment';

describe('Service: Message', () => {
  describe('list', () => {
    let createdMessages = [];

    before(async () => {
      createdMessages = await Promise.all([
        messageService.create({
          parentType: 'network',
          parentId: global.networks.flexAppeal.id,
          text: 'My cool message',
          resources: [{
            type: 'poll',
            data: { options: ['Yes', 'No', 'Ok'] },
          }],
        }, {
          credentials: global.users.admin,
          network: global.networks.flexAppeal,
        }),
        messageService.create({
          parentType: 'network',
          parentId: global.networks.flexAppeal.id,
          text: 'My other cool message',
          resources: [],
        }, {
          credentials: global.users.admin,
          network: global.networks.flexAppeal,
        }),
      ]);
    });

    after(() => Promise.map(createdMessages, (message) =>
      messageService.remove({ messageId: message.id })));

    it('should return message models', async () => {
      const actual = await messageService.list({
        messageIds: R.pluck('id', createdMessages),
      }, {
        credentials: global.users.admin,
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
          messageId: createdMessages[0].id, userId: global.users.admin.id }),
        messageService.like({
          messageId: createdMessages[0].id, userId: global.users.employee.id }),
      ]);

      const actual = await messageService.list({
        messageIds: R.pluck('id', createdMessages),
      }, {
        credentials: global.users.admin,
      });

      const likedMessage = R.find(R.propEq('id', createdMessages[0].id), actual);
      const otherMessage = R.find(R.propEq('id', createdMessages[1].id), actual);

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
        messageId: createdMessages[1].id,
        text: 'Foo comment for feed message!',
        userId: global.users.admin.id,
      });

      const actual = await messageService.list({
        messageIds: R.pluck('id', createdMessages),
      }, {
        credentials: global.users.admin,
      });

      const commentedMessage = R.find(R.propEq('id', createdMessages[1].id), actual);

      assert.lengthOf(actual, 2);
      assert.equal(commentedMessage.commentsCount, 1);
    });
  });

  describe('create', () => {
    let createdMessage;

    before(async () => {
      createdMessage = await messageService.create({
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
        text: 'My cool message',
        resources: [{
          type: 'poll',
          data: { options: ['Yes', 'No', 'Ok'] },
        }],
      }, {
        credentials: { id: global.users.admin.id },
        network: { id: global.networks.flexAppeal.id },
      });
    });

    after(() => messageService.remove({ messageId: createdMessage.id }));

    it('should create a message entry', async () => {
      const expected = await messageService.get({ messageId: createdMessage.id });

      assert.isDefined(expected);
      assert.property(expected, 'objectId');
      assert.equal(expected.text, 'My cool message');
      assert.property(expected, 'createdAt');
    });

    it('should create a poll entry if resource is present', async () => {
      const objects = await objectService.list({
        parentType: 'feed_message',
        parentId: createdMessage.id,
      });

      const pollEntry = await pollService.get({ pollId: objects[0].sourceId });

      assert.isDefined(pollEntry);
      assert.equal(pollEntry.networkId, global.networks.flexAppeal.id);
      assert.equal(pollEntry.userId, global.users.admin.id);
    });

    it('should create object entry for poll if resource is present', async () => {
      const expected = await objectService.list({
        parentType: 'feed_message',
        parentId: createdMessage.id,
      });

      assert.lengthOf(expected, 1);
      assert.equal(expected[0].userId, global.users.admin.id);
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
        parentId: global.networks.flexAppeal.id,
      });

      assert.equal(objects[0].sourceId, createdMessage.id);
      assert.equal(objects[0].objectType, 'feed_message');
    });
  });
});
