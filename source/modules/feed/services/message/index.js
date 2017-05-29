const R = require('ramda');
const Promise = require('bluebird');
const createError = require('../../../../shared/utils/create-error');
const attachmentService = require('../../../attachment/services/attachment');
const objectService = require('../../../core/services/object');
const FeedDispatcher = require('../../dispatcher');
const messageRepository = require('../../repositories/message');
const likeRepository = require('../../repositories/like');
const commentRepository = require('../../repositories/comment');
const impl = require('./implementation');
const { EObjectTypes, EParentTypes } = require('../../../core/definitions');

/**
 * @module modules/feed/services/message
 */

const logger = require('../../../../shared/services/logger')('FEED/service/message');

const isDefined = R.complement(R.isNil);
const isNotEmpty = R.complement(R.isEmpty);
const isAvailable = R.both(isDefined, isNotEmpty);

/**
 * Get comments for message of multiple messages
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - The id of the message to retrieve
 * @param {string[]} payload.messageIds - The id of the message to retrieve
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getComments
 * @return {external:Promise.<Comment[]>} {@link module:feed~Comment comment}
 */
const listComments = async (payload, message) => {
  logger.debug('Get comments for message', { payload, message });

  let whereConstraint = {};

  if (payload.messageId) whereConstraint = { messageId: payload.messageId };
  else if (payload.messageIds) whereConstraint = { messageId: { $in: payload.messageIds } };

  return commentRepository.findBy(whereConstraint);
};

/**
 * Listing messages
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.messageIds - The ids of the messages to list
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Message[]>} {@link module:feed~Message message}
 */
const list = async (payload, message) => {
  logger.debug('Listing multiple messages', { payload, message });

  const [messageResult, likeResult, commentResult] = await Promise.all([
    messageRepository.findByIds(payload.messageIds),
    likeRepository.findBy({ messageId: { $in: payload.messageIds } }),
    commentRepository.findBy({ messageId: { $in: payload.messageIds } }),
  ]);

  const byMessageId = (messageId, collection) =>
    R.filter(R.propEq('messageId', messageId), collection);
  const likesForMessage = (messageId) => byMessageId(messageId, likeResult);
  const commentsForMessage = (messageId) => byMessageId(messageId, commentResult);

  return R.map((feedMessage) => {
    const likes = likesForMessage(feedMessage.id);
    const comments = commentsForMessage(feedMessage.id);

    return R.merge(feedMessage, {
      hasLiked: R.pipe(R.pluck('userId'), R.contains(message.credentials.id))(likes),
      likesCount: likes.length,
      commentsCount: comments.length,
    });
  }, messageResult);
};

/**
 * Listing messages
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.organisationId - The id of the organisation to get messages for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listByOrganisation
 * @return {external:Promise.<Message[]>} {@link module:feed~Message message}
 */
const listByOrganisation = async (payload, message) => {
  logger.debug('Listing organisation messages', { payload, message });

  const objectIds = await messageRepository
    .findByOrganisation(payload.organisationId)
    .then(R.pluck('objectId'));

  return objectService.listWithSourceAndChildren({ objectIds }, message);
};

/**
 * Count objects for an organisation
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.organisationId - The id of the organisation to count messages for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method countByOrganisation
 * @return {external:Promise.<number>}
 */
const countByOrganisation = async (payload, message) => {
  logger.debug('Counting objects by organisation', { payload, message });

  return messageRepository.countByOrganisation(payload.organisationId);
};

/**
 * List likes for message or multiple messages
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - The id of the message to retrieve
 * @param {string[]} payload.messageIds - The id of the message to retrieve
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listLikes
 * @return {external:Promise.<Like[]>} {@link module:feed~Like like}
 */
const listLikes = async (payload, message) => {
  logger.debug('Listing likes for message', { payload, message });

  let whereConstraint = {};

  if (payload.messageId) whereConstraint = { messageId: payload.messageId };
  else if (payload.messageIds) whereConstraint = { messageId: { $in: payload.messageIds } };

  return likeRepository.findBy(whereConstraint);
};

/**
 * Get a single message
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - The id of the message to retrieve
 * @param {Array} payload.include - The includes
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method get
 * @return {external:Promise.<Message[]>} {@link module:feed~Message message}
 */
const getAsObject = async (payload, message) => {
  logger.debug('Finding message', { payload, message });
  const result = await messageRepository.findById(payload.messageId);

  if (!result) throw createError('404');

  const objectWithSourceAndChildren = await objectService.getWithSourceAndChildren({
    objectId: result.objectId,
  }, message);

  if (R.contains('comments', payload.include || [])) {
    objectWithSourceAndChildren.comments = listComments({ messageId: payload.messageId }, message);
  }

  if (R.contains('likes', payload.include || [])) {
    objectWithSourceAndChildren.likes = listLikes({ messageId: payload.messageId }, message);
  }

  return Promise.props(objectWithSourceAndChildren);
};

/**
 * Creates a message as authenticated user with an associated object entry.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.parentType - The type of parent to create the object for
 * @param {string} payload.parentId - The id of the parent
 * @param {string} [payload.messageType] - The type of the message. Defaults to default_message.
 * @param {string} [payload.organisationId] - The id of the organisation to send for.
 * @param {string} [payload.networkId] - The id of the network to send for.
 * @param {string} payload.text - The text of the message
 * @param {string[]} payload.files - The id of attachments that should be associated
 * @param {string} payload.pollQuestion - The poll question
 * @param {string[]} payload.pollOptions - The poll options
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Message>} {@link module:feed~Message message}
 */
const create = async (payload, message) => {
  logger.debug('Creating message', { payload, message });

  const checkPayload = R.compose(isAvailable, R.prop(R.__, payload));
  const parent = await objectService.getParent(R.pick(['parentType', 'parentId'], payload));

  const networkId = R.cond([
    [R.has('networkId'), R.prop('networkId')],
    [R.propEq('type', EParentTypes.ORGANISATION), R.always(null)],
    [R.propEq('type', EParentTypes.TEAM), R.prop('networkId')],
    [R.T, R.always(null)],
  ])(parent);

  const organisationId = R.cond([
    [R.has('organisationId'), R.prop('organisationId')],
    [R.propEq('parentType', EParentTypes.ORGANISATION), R.prop('parentId')],
    [R.T, R.always(null)],
  ])(payload);

  const objectType = R.cond([
    [R.always(R.has('objectType', payload)), R.always(R.prop('objectType', payload))],
    [R.propEq('type', EObjectTypes.ORGANISATION), R.always(EObjectTypes.ORGANISATION_MESSAGE)],
    [R.T, R.always('feed_message')],
  ])(parent);

  const parentEntity = `${payload.parentType.slice(0, 1)
      .toUpperCase()}${payload.parentType.slice(1)}`;

  const createdMessage = await messageRepository.create({
    parentType: `FlexAppeal\\Entities\\${parentEntity}`, // Backwards compatibility for PHP API
    parentId: payload.parentId,
    objectId: null,
    text: payload.text,
    createdBy: message.credentials.id,
    messageType: payload.messageType || 'default_message',
  });

  const data = {
    networkId,
    organisationId,
    userId: message.credentials.id,
    parentType: payload.parentType,
    parentId: payload.parentId,
    objectType,
    sourceId: createdMessage.id,
  };
  const createdObject = await objectService.create(data, message);

  await messageRepository.update(createdMessage.id, { objectId: createdObject.id });

  if (checkPayload('files')) {
    await attachmentService.assertAttachmentsExist({ attachmentIds: payload.files }, message);

    const filesArray = R.flatten([payload.files]);
    const updateMessageIds = Promise.map(filesArray, (attachmentId) => attachmentService.update({
      whereConstraint: { id: attachmentId },
      attributes: { messageId: createdMessage.id },
    }));

    const createObjects = Promise.map(filesArray, (attachmentId) => objectService.create({
      networkId,
      organisationId,
      userId: message.credentials.id,
      parentType: 'feed_message',
      parentId: createdMessage.id,
      objectType: 'attachment',
      sourceId: attachmentId,
    }, message).then((attachmentObject) => attachmentService.update({
      whereConstraint: { id: attachmentObject.sourceId },
      attributes: { objectId: attachmentObject.id },
    }, message)));

    await Promise.all([updateMessageIds, createObjects]);
  }

  if (checkPayload('pollOptions') && checkPayload('pollQuestion')) {
    await impl.createPollResource(createdMessage, message)(
      R.pick(['pollOptions', 'pollQuestion'], payload));
  }

  const objectWithSourceAndChildren = await objectService.getWithSourceAndChildren({
    objectId: createdObject.id,
  }, message);

  FeedDispatcher.emit('message.created', {
    parent,
    organisationId,
    networkId,
    actor: message.credentials,
    object: objectWithSourceAndChildren,
    credentials: message.credentials,
  });

  return objectWithSourceAndChildren;
};

/**
 * Creates a message as authenticated user without associated object
 * @param {object} payload - Object containing payload data
 * @param {string} payload.organisationId - The id of the organisation
 * @param {string} payload.messageType - The type of message to create
 * @param {string} payload.text - The text of the message
 * @param {object} payload.files - The id of attachments that should be associated
 * @param {object} payload.pollQuestion - The poll question
 * @param {array} payload.pollOptions - The poll options
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createWithoutObject
 * @return {external:Promise.<Message>} {@link module:Message message}
 */
const createWithoutObject = async (payload, message) => {
  logger.debug('Creating message without object', { payload, message });

  const checkPayload = R.compose(isAvailable, R.prop(R.__, payload));

  const createdMessage = await messageRepository.create({
    parentType: 'FlexAppeal\\Entities\\DEPRECATED', // Backwards compatibility for PHP API
    parentId: 0,
    objectId: null,
    text: payload.text,
    createdBy: message.credentials.id,
    messageType: payload.messageType || 'default_message',
  });

  if (checkPayload('files')) {
    await attachmentService.assertAttachmentsExist({ attachmentIds: payload.files }, message);

    const filesArray = R.flatten([payload.files]);
    const updateMessageIds = Promise.map(filesArray, (attachmentId) => attachmentService.update({
      whereConstraint: { id: attachmentId },
      attributes: { messageId: createdMessage.id },
    }));

    const createObjects = Promise.map(filesArray, (attachmentId) => objectService.create({
      networkId: null,
      organisationId: payload.organisationId,
      userId: message.credentials.id,
      parentType: 'feed_message', // TODO - check if this actually works
      parentId: createdMessage.id,
      objectType: 'attachment',
      sourceId: attachmentId,
    }, message).then((attachmentObject) => attachmentService.update({
      whereConstraint: { id: attachmentObject.sourceId },
      attributes: { objectId: attachmentObject.id },
    }, message)));

    await Promise.all([updateMessageIds, createObjects]);
  }

  if (checkPayload('pollOptions') && checkPayload('pollQuestion')) {
    await impl.createPollResource(createdMessage, message)(
      R.pick(['pollOptions', 'pollQuestion'], payload));
  }

  return createdMessage;
};

/**
 * Creates an object for a message
 * @param {object} payload - Object containing payload data
 * @param {string} [payload.organisationId] - The id of the organisation
 * @param {string} [payload.networkId] - The id of the network
 * @param {string} payload.parentType - The type of parent to create the object for
 * @param {string} payload.parentId - The id of the parent
 * @param {string} payload.objectType - The type of object
 * @param {string} payload.sourceId - The id of the source
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createObjectForMessage
 * @return {external:Promise.<Message>} {@link module:Message message}
 */
const createObjectForMessage = async (payload, message) => {
  logger.debug('Creating object for message', { payload, message });

  const createdObject = await objectService.create({
    networkId: payload.networkId || null,
    organisationId: payload.organisationId || null,
    userId: message.credentials.id,
    parentType: payload.parentType,
    parentId: payload.parentId,
    objectType: payload.objectType,
    sourceId: payload.sourceId,
  }, message);

  const parent = await objectService.getParent(R.pick(['parentType', 'parentId'], payload));

  const objectWithSourceAndChildren = await objectService.getWithSourceAndChildren({
    objectId: createdObject.id,
  }, message);

  FeedDispatcher.emit('message.created', {
    parent,
    organisationId: payload.organisationId || null,
    networkId: payload.networkId || null,
    actor: message.credentials,
    object: objectWithSourceAndChildren,
    credentials: message.credentials,
  });
};

/**
 * Updates a message as authenticated user with an associated object entry.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.parentType - The type of parent to create the object for
 * @param {string} payload.parentId - The id of the parent
 * @param {string} payload.text - The text of the message
 * @param {object[]} payload.resources - The resources that belong to the message
 * @param {string} payload.resources[].type - The type of the resource
 * @param {object} payload.resources[].data - The data for the resource
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method update
 * @return {external:Promise.<Object>} {@link module:feed~Object object}
 */
const update = async (payload, message) => {
  logger.debug('Updating message', { payload, message });

  const foundMessage = await messageRepository.findById(payload.messageId);
  if (!foundMessage) throw createError('404');

  await impl.assertThatCurrentOwnerHasUpdateRights(foundMessage.objectId, message);
  await messageRepository.update(foundMessage.id, { text: payload.text });

  return objectService.getWithSourceAndChildren({ objectId: foundMessage.objectId }, message);
};
/**
 * Likes a message
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - The id of the message to like
 * @param {string} payload.userId - The id of the user that likes the message
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method like
 * @return {external:Promise.<Message[]>} {@link module:feed~Message message}
 */
const like = async (payload, message) => {
  logger.debug('Liking message', { payload, message });

  const messageToLike = await getAsObject({ messageId: payload.messageId }, message);
  if (!messageToLike) throw createError('404');

  await likeRepository.create(payload.messageId, payload.userId);

  messageToLike.source.hasLiked = true;
  messageToLike.source.likesCount += 1;

  return messageToLike;
};

/**
 * Deletes a message
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - The type of parent to create the object for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method remove
 * @return {external:Promise.<Boolean>}
 */
const remove = async (payload, message) => {
  logger.debug('Deleting message', { payload, message });

  // TODO ACL: Only an admin or the creator of the message can delete.

  await messageRepository.destroy(payload.messageId);
  await impl.removeAttachedObjects(payload.messageId);

  return true;
};

exports.countByOrganisation = countByOrganisation;
exports.create = create;
exports.createWithoutObject = createWithoutObject;
exports.createObjectForMessage = createObjectForMessage;
exports.getAsObject = getAsObject;
exports.like = like;
exports.list = list;
exports.listByOrganisation = listByOrganisation;
exports.listComments = listComments;
exports.listLikes = listLikes;
exports.remove = remove;
exports.update = update;
