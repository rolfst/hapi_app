const { assert } = require('chai');
const sinon = require('sinon');
const R = require('ramda');
const stream = require('stream');
const Promise = require('bluebird');
const testHelpers = require('../../../../shared/test-utils/helpers');
const Storage = require('../../../../shared/services/storage');
const pollService = require('../../../poll/services/poll');
const attachmentService = require('../../../attachment/services/attachment');
const attachmentDefinitions = require('../../../attachment/definitions');
const objectService = require('../../../core/services/object');
const commentService = require('../comment');
const messageService = require('./index');
const messageRepo = require('../../repositories/message');

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
      const team = await testHelpers.createTeamInNetwork(network.id);

      createdMessages = await Promise.all([
        messageService.create({
          parentType: 'network',
          parentId: network.id,
          text: 'My cool message',
          pollQuestion: 'Are we cool?',
          pollOptions: ['Yes', 'No', 'Ok'],
        }, { network, credentials: admin }),
        messageService.create({
          parentType: 'team',
          parentId: team.id,
          text: 'My other cool message',
        }, { network, credentials: admin }),
      ]);
    });

    after(() => testHelpers.cleanAll());

    it('should return message models', async () => {
      const actual = await messageService.list({
        messageIds: R.pluck('sourceId', createdMessages),
      }, {
        credentials: employee,
      });

      assert.lengthOf(actual, 2);
      assert.property(actual[0], 'id');
      assert.property(actual[0], 'text');
      assert.property(actual[0], 'hasLiked');
      assert.property(actual[0], 'likesCount');
      assert.property(actual[0], 'commentsCount');
      assert.property(actual[0], 'createdAt');
    });

    it('should return correct like count', async () => {
      await Promise.all([
        messageService.like({
          messageId: createdMessages[0].sourceId,
          userId: admin.id }, { credentials: admin }),
        messageService.like({
          messageId: createdMessages[0].sourceId, userId: employee.id }, { credentials: admin }),
      ]);

      const actual = await messageService.list({
        messageIds: R.pluck('sourceId', createdMessages),
      }, { credentials: admin });

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
      }, { credentials: admin });

      const commentedMessage = R.find(R.propEq('id', createdMessages[1].sourceId), actual);

      assert.lengthOf(actual, 2);
      assert.equal(commentedMessage.commentsCount, 1);
    });
  });

  describe('Create poll', () => {
    let createdMessage;

    before(async () => {
      admin = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });

      createdMessage = await messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'My cool message',
        pollQuestion: 'Should we help?',
        pollOptions: ['Yes', 'No', 'Ok'],
      }, { network, credentials: admin });
    });

    after(() => testHelpers.cleanAll());

    it('should return object with source after create', () => {
      assert.equal(createdMessage.userId, admin.id);
      assert.equal(createdMessage.objectType, 'feed_message');
      assert.equal(createdMessage.parentType, 'network');
      assert.equal(createdMessage.parentId, network.id);
      assert.equal(createdMessage.source.text, 'My cool message');
      assert.equal(createdMessage.children[0].objectType, 'poll');
      assert.equal(createdMessage.children[0].userId, createdMessage.userId);
      assert.deepEqual(createdMessage.children[0].source.options[0].text, 'Yes');
      assert.deepEqual(createdMessage.children[0].source.options[1].text, 'No');
      assert.deepEqual(createdMessage.children[0].source.options[2].text, 'Ok');
    });

    it('should create a message entry', async () => {
      const expected = await messageRepo.findById(createdMessage.sourceId);

      assert.isDefined(expected);
      assert.equal(expected.text, 'My cool message');
      assert.property(expected, 'createdAt');
    });

    it('should create a poll entry if resource is present', async () => {
      const pollEntry = await pollService.list({
        constraint: { messageId: createdMessage.sourceId },
      }, { credentials: admin }).then(R.head);

      assert.isDefined(pollEntry);
      assert.equal(pollEntry.messageId, createdMessage.sourceId);
      assert.equal(pollEntry.question, createdMessage.children[0].source.question);
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

  describe('Create attachment', () => {
    let createdMessage;
    let sandbox;

    before(async () => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(Storage, 'upload').returns(Promise.resolve('image.jpg'));

      admin = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });

      const attachment = await attachmentService.create({
        fileStream: new stream.Readable(),
      }, { network, credentials: admin });

      createdMessage = await messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'My cool message',
        files: [attachment.id],
      }, { network, credentials: admin });
    });

    after(() => {
      sandbox.restore();
      return testHelpers.cleanAll();
    });

    it('should return object with children and source', () => {
      assert.equal(createdMessage.children[0].parentType, 'feed_message');
      assert.equal(createdMessage.children[0].parentId, createdMessage.sourceId);
      assert.equal(createdMessage.children[0].objectType, 'attachment');
      assert.equal(createdMessage.children[0].source.path,
        'https://assets.flex-appeal.nl/development/attachments/image.jpg');
      assert.equal(
        createdMessage.children[0].source.parentType,
        attachmentDefinitions.EParentTypes.FEED_MESSAGE
      );
      assert.equal(createdMessage.children[0].source.parentId, createdMessage.children[0].id);
    });

    it('should create an attachment entry if resource is present', async () => {
      const attachmentEntry = await attachmentService.get({
        whereConstraint: {
          parentType: attachmentDefinitions.EParentTypes.FEED_MESSAGE,
          parentId: createdMessage.sourceId,
        },
      });

      assert.isDefined(attachmentEntry);
      assert.equal(attachmentEntry.parentId, createdMessage.sourceId);
      assert.equal(attachmentEntry.parentType, attachmentDefinitions.EParentTypes.FEED_MESSAGE);
      assert.equal(attachmentEntry.path,
        'https://assets.flex-appeal.nl/development/attachments/image.jpg');
    });

    it('should create a message entry', async () => {
      const expected = await messageRepo.findById(createdMessage.sourceId);

      assert.isDefined(expected);
      assert.equal(expected.text, 'My cool message');
      assert.property(expected, 'createdAt');
    });

    it('should throw error when providing invalid attachment ids', async () => {
      const createMessagePromise = messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'My cool message',
        files: [-1],
      }, { network, credentials: admin });

      return assert.isRejected(createMessagePromise, /Please provide valid attachment ids/);
    });
  });

  describe('Update', () => {
    let createdMessage;
    let createdTeamMessage;

    before(async () => {
      [admin, employee] = await Promise.all([
        testHelpers.createUser({ password: 'foo' }),
        testHelpers.createUser({ password: 'foo' }),
      ]);
      const teamMember = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });
      const team = await testHelpers.createTeamInNetwork(network.id);

      await testHelpers.addUserToNetwork({ networkId: network.id, userId: employee.id });
      await testHelpers.addUserToNetwork({ networkId: network.id, userId: teamMember.id });

      createdMessage = await messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'My cool message',
        pollQuestion: 'Are we ok?',
        poll: { options: ['Yes', 'No', 'Ok'] },
      }, {
        credentials: { id: admin.id },
        network: { id: network.id },
      });
      createdTeamMessage = await messageService.create({
        parentType: 'team',
        parentId: team.id,
        text: 'My cool message',
      }, {
        credentials: { id: teamMember.id },
        network: { id: network.id },
      });
    });

    after(() => testHelpers.cleanAll());

    it('should update a message entry', async () => {
      await messageService.update({
        messageId: createdMessage.source.id,
        text: 'My cool updated message',
      }, { credentials: admin });

      const expected = await messageRepo.findById(createdMessage.sourceId);

      assert.isDefined(expected);
      assert.equal(expected.text, 'My cool updated message');
      assert.property(expected, 'createdAt');
      assert.isNotNull(expected.createdAt);
    });

    it('should update a team message entry by an admin', async () => {
      await messageService.update({
        messageId: createdTeamMessage.source.id,
        text: 'My cool updated message',
      }, { credentials: admin });

      const expected = await messageRepo.findById(createdTeamMessage.sourceId);

      assert.isDefined(expected);
      assert.equal(expected.text, 'My cool updated message');
      assert.property(expected, 'createdAt');
      assert.isNotNull(expected.createdAt);
    });

    it('should not allow an update by a different person a message entry', async () => {
      const updatePromise = messageService.update({
        messageId: createdMessage.source.id,
        text: 'My cool updated message',
      }, { credentials: { id: employee.id } });

      return assert.isRejected(updatePromise, 'User does not have enough privileges to access this resource.');
    });
  });
});
