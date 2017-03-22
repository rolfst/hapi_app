/* global BindingTypeService */
const R = require('ramda');
const Promise = require('bluebird');
const Logger = require('../../../../shared/services/logger');
const createError = require('../../../../shared/utils/create-error');
const attachmentService = require('../../../attachment/services/attachment');
const objectService = require('../../../core/services/object');
const FeedDispatcher = require('../../dispatcher');
const messageRepository = require('../../repositories/message');
const likeRepository = require('../../repositories/like');
const commentRepository = require('../../repositories/comment');
const impl = require('./implementation');

/**
 * @module modules/feed/services/message
 */

const logger = Logger.getLogger('FEED/service/message');

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
  logger.info('Get comments for message', { payload, message });

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
  logger.info('Listing multiple messages', { payload, message });

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
 * List likes for message or multiple messages
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - The id of the message to retrieve
 * @param {string[]} payload.messageIds - The id of the message to retrieve
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listLikes
 * @return {external:Promise.<Like[]>} {@link module:feed~Like like}
 */
const listLikes = async (payload, message) => {
  logger.info('Listing likes for message', { payload, message });

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
  logger.info('Finding message', { payload, message });
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
 * @param {string} payload.text - The text of the message
 * @param {object} payload.files - The id of attachments that should be associated
 * @param {object} payload.pollQuestion - The poll question
 * @param {array} payload.pollOptions - The poll options
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Message>} {@link module:feed~Message message}
 */
const create = async (payload, message) => {
  logger.info('Creating message', { payload, message });

  const checkPayload = R.compose(isAvailable, R.prop(R.__, payload));
  const parent = await objectService.getParent(R.pick(['parentType', 'parentId'], payload));
  const networkId = R.ifElse(
    R.propEq('type', 'team'),
    R.prop('networkId'),
    R.prop('id'))(parent);

  const parentEntity = `${payload.parentType.slice(0, 1)
      .toUpperCase()}${payload.parentType.slice(1)}`;
  const createdMessage = await messageRepository.create({
    parentType: `FlexAppeal\\Entities\\${parentEntity}`, // Backwards compatibility for PHP API
    parentId: payload.parentId,
    objectId: null,
    text: payload.text,
    createdBy: message.credentials.id,
  });

  const createdObject = await objectService.create({
    networkId,
    userId: message.credentials.id,
    parentType: payload.parentType,
    parentId: payload.parentId,
    objectType: 'feed_message',
    sourceId: createdMessage.id,
  }, message);

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
    networkId,
    actor: message.credentials,
    object: objectWithSourceAndChildren,
    credentials: message.credentials,
  });

  return objectWithSourceAndChildren;
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
  logger.info('Updating message', { payload, message });

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
  logger.info('Liking message', { payload, message });

  const messageToLike = await getAsObject({ messageId: payload.messageId }, message);
  if (!messageToLike) throw createError('404');

  await likeRepository.create(payload.messageId, payload.userId);

  messageToLike.source.hasLiked = true;
  messageToLike.source.likesCount++;

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
  logger.info('Deleting message', { payload, message });

  // TODO ACL: Only an admin or the creator of the message can delete.

  await messageRepository.destroy(payload.messageId);
  await impl.removeAttachedObjects(payload.messageId);

  return true;
};

BindingTypeService.registerSource('feed_message', list);

// exports of functions
exports.create = create;
exports.getAsObject = getAsObject;
exports.like = like;
exports.list = list;
exports.listComments = listComments;
exports.listLikes = listLikes;
exports.remove = remove;
exports.update = update;
