import { assert } from 'chai';
import R from 'ramda';
import * as testHelper from '../../../../shared/test-utils/helpers';
import * as messageService from '../message';
import * as commentService from './index';

describe('Service: Comment (feed)', () => {
  describe('create', () => {
    let createdMessage;
    let admin;

    before(async () => {
      admin = await testHelper.createUser({ password: 'foo' });
      const network = await testHelper.createNetwork({ userId: admin.id });

      createdMessage = await messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'Message for feed',
      }, {
        credentials: { id: admin.id },
        network: { id: network.id },
      });
    });

    after(() => testHelper.cleanAll());

    it('should return comment model after creation', async () => {
      const actual = await commentService.create({
        messageId: createdMessage.sourceId,
        userId: admin.id,
        text: 'Cool new comment',
      });

      assert.property(actual, 'id');
      assert.property(actual, 'createdAt');
      assert.equal(actual.userId, admin.id);
      assert.equal(actual.messageId, createdMessage.sourceId);
      assert.equal(actual.text, 'Cool new comment');
    });

    it('should return 404 when message not found', async () => {
      const commentPromise = commentService.create({
        messageId: '5453451',
        userId: admin.id,
        text: 'Cool comment',
      });

      return assert.isRejected(commentPromise, /Message not found./);
    });
  });

  describe('list', () => {
    let createdComments = [];

    before(async () => {
      const admin = await testHelper.createUser({ password: 'foo' });
      const network = await testHelper.createNetwork({ userId: admin.id });

      const createdMessage = await messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'Message for feed',
      }, {
        credentials: { id: admin.id },
        network: { id: network.id },
      });

      createdComments = await Promise.all([
        commentService.create({
          messageId: createdMessage.sourceId,
          userId: admin.id,
          text: 'Cool comment',
        }),
      ]);
    });

    after(() => testHelper.cleanAll());

    it('should return a collection of comment models', async () => {
      const actual = await commentService.list({
        commentIds: R.pluck('id', createdComments),
      });

      assert.lengthOf(actual, 1);
      assert.equal(actual[0].text, 'Cool comment');
    });
  });
});
