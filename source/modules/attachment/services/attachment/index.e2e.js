import { assert } from 'chai';
import sinon from 'sinon';
import * as testHelper from '../../../../shared/test-utils/helpers';
import * as Storage from '../../../../shared/services/storage';
import * as messageService from '../../../feed/services/message';
import * as attachmentRepo from '../../repositories/attachment';
import * as attachmentService from './index';
import AttachmentDAO from '../../repositories/dao/attachment';

describe('Service: Attachment', () => {
  let admin;
  let sandbox;
  let network;

  describe('create', () => {
    before(async () => {
      sandbox = sinon.sandbox.create();

      admin = await testHelper.createUser();
      network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
    });

    after(async () => {
      sandbox.restore();
      return testHelper.cleanAll();
    });

    it('should create a attachment', async () => {
      const fileName = 'test.jpg';
      sandbox.stub(Storage, 'upload').returns(Promise.resolve(fileName));
      const createdMessage = await messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'My cool message',
      }, { network, credentials: admin });

      const actual = await attachmentService.create({
        parentId: createdMessage.sourceId,
        parentType: 'feed_message',
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

    it('should set message_id for backwards compatibility', async () => {
      const fileName = 'test.jpg';
      sandbox.stub(Storage, 'upload').returns(Promise.resolve(fileName));
      const createdMessage = await messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'My cool message',
      }, { network, credentials: admin });

      const actual = await attachmentService.create({
        parentId: createdMessage.sourceId,
        parentType: 'feed_message',
        file: { file: new Buffer('Foo'), filename: fileName },
      }, { credentials: admin });

      // Only directly accessing DAO for backwards compatibility purpose
      const attachment = await AttachmentDAO.findOne({ where: { objectId: actual.objectId } });

      Storage.upload.restore();

      assert.equal(attachment.messageId, createdMessage.sourceId);
    });
  });
});
