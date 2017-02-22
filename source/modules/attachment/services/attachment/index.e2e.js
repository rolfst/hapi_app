import { assert } from 'chai';
import sinon from 'sinon';
import * as testHelper from '../../../../shared/test-utils/helpers';
import * as Storage from '../../../../shared/services/storage';
import * as objectRepo from '../../../feed/repositories/object';
import * as attachmentRepo from '../../repositories/attachment';
import * as attachmentService from './index';

describe('Service: Attachment', () => {
  let admin;
  let sandbox;

  describe('create', () => {
    before(async () => {
      sandbox = sinon.sandbox.create();

      admin = await testHelper.createUser();
      await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
    });

    after(async () => {
      sandbox.restore();
      return testHelper.cleanAll();
    });

    it('should create a attachment', async () => {
      const fileName = 'test.jpg';
      sandbox.stub(Storage, 'upload').returns(Promise.resolve(fileName));

      const actual = await attachmentService.create({
        parentType: 'feed_message',
        parentId: '23',
        file: { file: new Buffer('Foo'), filename: fileName },
      }, { credentials: admin });
      const attachments = await attachmentRepo.findBy({ objectId: actual.objectId });

      Storage.upload.restore();

      assert.equal(attachments.length, 1);
      assert.equal(actual.type, 'attachment');
      assert.property(actual, 'objectId');
      assert.property(actual, 'path');
      assert.equal(actual.path, 'https://assets.flex-appeal.nl/development/attachments/test.jpg');
      assert.property(actual, 'createdAt');
      assert.isNotNull(actual.createdAt);
    });
  });

  describe('creation flow', () => {
    let createdAttachment;
    let createdObject;

    before(async () => {
      sandbox = sinon.sandbox.create();

      const user = await testHelper.createUser();
      await testHelper.createNetwork({ userId: user.id, name: 'flexappeal' });

      createdAttachment = await attachmentRepo.create('test.jpg');
      createdObject = await objectRepo.create({
        sourceId: '1',
        objectType: 'attachment',
        parentType: 'message_feed',
        parentId: '2',
        userId: user.id,
      });
    });

    after(async () => testHelper.cleanAll());

    it('should contain an updated attachment with object id', async () => {
      await attachmentService.update({
        attachmentId: createdAttachment.id,
        attributes: { objectId: createdObject.id },
      }, {});

      const attachments = await attachmentRepo.findBy({ objectId: createdObject.id });

      assert.equal(attachments.length, 1);
      assert.equal(attachments[0].type, 'attachment');
      assert.property(attachments[0], 'objectId');
      assert.isNotNull(attachments[0].objectId);
      assert.property(attachments[0], 'path');
      assert.isNotNull(attachments[0].path);
      assert.equal(attachments[0].path, createdAttachment.path);
    });
  });
});
