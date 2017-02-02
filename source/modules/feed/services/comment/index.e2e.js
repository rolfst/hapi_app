import { assert } from 'chai';
import R from 'ramda';
import * as messageService from '../message';
import * as commentService from './index';

describe('Service: Comment (feed)', () => {
  describe('create', () => {
    let createdMessage;

    before(async () => {
      createdMessage = await messageService.create({
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
        text: 'Message for feed',
      }, {
        credentials: { id: global.users.admin.id },
        network: { id: global.networks.flexAppeal.id },
      });
    });

    after(() => messageService.remove({ messageId: createdMessage.id }));

    it('should return comment model after creation', async () => {
      const actual = await commentService.create({
        messageId: createdMessage.id,
        userId: global.users.admin.id,
        text: 'Cool new comment',
      });

      assert.property(actual, 'id');
      assert.property(actual, 'createdAt');
      assert.equal(actual.userId, global.users.admin.id);
      assert.equal(actual.messageId, createdMessage.id);
      assert.equal(actual.text, 'Cool new comment');
    });

    it('should return 404 when message not found', async () => {
      const commentPromise = commentService.create({
        messageId: '5453451',
        userId: global.users.admin.id,
        text: 'Cool comment',
      });

      return assert.isRejected(commentPromise, /The resource could not be found./);
    });
  });

  describe('list', () => {
    let createdComments = [];
    let createdMessage;

    before(async () => {
      createdMessage = await messageService.create({
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
        text: 'Message for feed',
      }, {
        credentials: { id: global.users.admin.id },
        network: { id: global.networks.flexAppeal.id },
      });

      createdComments = await Promise.all([
        commentService.create({
          messageId: createdMessage.id,
          userId: global.users.admin.id,
          text: 'Cool comment',
        }),
      ]);
    });

    after(() => messageService.remove({ messageId: createdMessage.id }));

    it('should return a collection of comment models', async () => {
      const actual = await commentService.list({
        commentIds: R.pluck('id', createdComments),
      });

      assert.lengthOf(actual, 1);
      assert.equal(actual[0].text, 'Cool comment');
    });
  });
});
