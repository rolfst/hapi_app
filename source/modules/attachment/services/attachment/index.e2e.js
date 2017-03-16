const { assert } = require('chai');
const sinon = require('sinon');
const stream = require('stream');
const testHelper = require('../../../../shared/test-utils/helpers');
const Storage = require('../../../../shared/services/storage');
const messageService = require('../../../feed/services/message');
const attachmentService = require('./index');
const AttachmentDAO = require('../../repositories/dao/attachment');

describe('Service: Attachment', () => {
  let admin;
  let sandbox;
  let network;
  let fileName;

  describe('create', () => {
    before(async () => {
      sandbox = sinon.sandbox.create();
      fileName = 'image.jpg';
      sandbox.stub(Storage, 'upload').returns(Promise.resolve(fileName));

      admin = await testHelper.createUser();
      network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
    });

    after(async () => {
      sandbox.restore();
      return testHelper.cleanAll();
    });

    it('should create a attachment', async () => {
      const actual = await attachmentService.create({
        fileStream: new stream.Readable(),
      }, { credentials: admin });

      assert.isDefined(actual);
      assert.equal(actual.type, 'attachment');
      assert.property(actual, 'objectId');
      assert.property(actual, 'path');
      assert.equal(actual.path, `https://assets.flex-appeal.nl/development/attachments/${fileName}`);
      assert.property(actual, 'createdAt');
      assert.isNotNull(actual.createdAt);
    });

    it('should set message_id for backwards compatibility', async () => {
      const attachment = await attachmentService.create({
        fileStream: new stream.Readable(),
      }, { credentials: admin });

      const createdMessage = await messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'My cool message',
        files: [attachment.id],
      }, { network, credentials: admin });

      // Only directly accessing DAO for backwards compatibility purpose
      const attachmentResult = await AttachmentDAO.findOne({
        where: { id: attachment.id },
      });

      assert.equal(attachmentResult.messageId, createdMessage.sourceId);
    });
  });
});
