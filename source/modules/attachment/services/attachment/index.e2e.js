import { assert } from 'chai';
import stream from 'stream';
import sinon from 'sinon';
import * as objectRepo from '../../../feed/repositories/object';
import * as testHelper from '../../../../shared/test-utils/helpers';
import * as uploadService from '../../../upload/services/upload';
import * as attachmentService from './index';
import * as attachmentRepo from '../../repositories/attachment';

const Readable = stream.Readable;

describe('Service: Attachment', () => {
  let message;
  let sandbox;

  describe('create', () => {
    before(async () => {
      sandbox = sinon.sandbox.create();

      const admin = await testHelper.createUser();
      await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

      message = { credentials: { id: admin.id } };
    });

    after(async () => {
      sandbox.restore();
      return testHelper.cleanAll();
    });

    it('should create a attachment', async () => {
      const imageLocation = '/attachments/test.jpg';
      sandbox.stub(uploadService, 'upload').returns(Promise.resolve(imageLocation));

      const readStream = new Readable;
      readStream.push('image');
      readStream.push(null);
      const payload = { upload: { name: 'image.jpg', stream: readStream } };

      const actual = await attachmentService.create(payload, message);
      const attachments = await testHelper.findAllAttachments();

      assert.equal(attachments.length, 1);
      assert.equal(actual.type, 'attachment');
      assert.property(actual, 'objectId');
      assert.isNull(actual.objectId);
      assert.property(actual, 'path');
      assert.equal(actual.path, imageLocation);
      assert.property(actual, 'createdAt');
      assert.isNotNull(actual.createdAt);
    });
  });

  describe('creation flow', () => {
    let attachment;

    before(async () => {
      sandbox = sinon.sandbox.create();

      const user = await testHelper.createUser();
      await testHelper.createNetwork({ userId: user.id, name: 'flexappeal' });

      message = { credentials: { id: user.id } };
      attachment = await attachmentRepo.create('/attachment/test.jpg');
      const objectRef = await objectRepo.create({
        sourceId: 1,
        objectType: 'attachment',
        parentType: 'message_feed',
        parentId: 2,
        userId: user.id,
      });

      attachment.objectId = objectRef.id;
    });

    after(async () => testHelper.cleanAll());

    it('should contain an updated attachment with object id', async () => {
      await attachmentService.update({ attachment }, {});
      const attachments = await testHelper.findAllAttachments();

      assert.equal(attachments.length, 1);
      assert.equal(attachments[0].type, 'attachment');
      assert.property(attachments[0], 'objectId');
      assert.isNotNull(attachments[0].objectId);
      assert.property(attachments[0], 'path');
      assert.isNotNull(attachments[0].path);
      assert.equal(attachments[0].path, attachment.path);
    });
  });
});
