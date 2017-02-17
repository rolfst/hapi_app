import R from 'ramda';
import Promise from 'bluebird';
import * as Logger from '../../../../shared/services/logger';
import createError from '../../../../shared/utils/create-error';
import * as attachmentService from '../../../attachment/services/attachment';
import FeedDispatcher from '../../dispatcher';
import * as messageRepository from '../../repositories/message';
import * as likeRepository from '../../repositories/like';
import * as commentRepository from '../../repositories/comment';
import * as objectService from '../object';
import * as impl from './implementation';

/**
 * @module modules/feed/services/message
 */

const logger = Logger.getLogger('FEED/service/message');

/**
 * Get a single message
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - The id of the message to retrieve
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method get
 * @return {external:Promise.<Message[]>} {@link module:feed~Message message}
 */
export const get = async (payload, message) => {
  logger.info('Finding message', { payload, message });
  const result = await messageRepository.findById(payload.messageId);

  if (!result) throw createError('404');
  // TODO find child object

  return result;
};

/**
 * Get comments for message of multiple messages
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - The id of the message to retrieve
 * @param {string[]} payload.messageIds - The id of the message to retrieve
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getComments
 * @return {external:Promise.<Comment[]>} {@link module:feed~Comment comment}
 */
export const getComments = async (payload, message) => {
  logger.info('Get comments for message', { payload, message });

  let whereConstraint = {};

  if (payload.messageId) whereConstraint = { messageId: payload.messageId };
  else if (payload.messageIds) whereConstraint = { messageId: { $in: payload.messageIds } };

  return commentRepository.findBy(whereConstraint);
};

/**
 * Get likes for message of multiple messages
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - The id of the message to retrieve
 * @param {string[]} payload.messageIds - The id of the message to retrieve
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getLikes
 * @return {external:Promise.<Like[]>} {@link module:feed~Like like}
 */
export const getLikes = async (payload, message) => {
  logger.info('Get likes for message', { payload, message });

  let whereConstraint = {};

  if (payload.messageId) whereConstraint = { messageId: payload.messageId };
  else if (payload.messageIds) whereConstraint = { messageId: { $in: payload.messageIds } };

  return likeRepository.findBy(whereConstraint);
};

/**
 * Listing messages
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.messageIds - The ids of the messages to list
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Message[]>} {@link module:feed~Message message}
 */
export const list = async (payload, message) => {
  logger.info('Listing multiple messages', { payload, message });
  // TODO Listing messages with their children objects
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

    return {
      ...feedMessage,
      hasLiked: R.pipe(R.pluck('userId'), R.contains(message.credentials.id))(likes),
      likesCount: likes.length,
      commentsCount: comments.length,
    };
  }, messageResult);
};

/**
 * Creates a message as authenticated user with an associated object entry.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.parentType - The type of parent to create the object for
 * @param {string} payload.parentId - The id of the parent
 * @param {string} payload.text - The text of the message
 * @param {object} payload.atachments - A collection of attachments
 * @param {object} payload.poll - The poll
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Message>} {@link module:feed~Message message}
 */
export const create = async (payload, message) => {
  logger.info('Creating message', { payload, message });

  const parent = await objectService.getParent(R.pick(['parentType', 'parentId'], payload));

  const createdMessage = await messageRepository.create({
    objectId: null,
    text: payload.text,
  });

  const createdObject = await objectService.create({
    userId: message.credentials.id,
    parentType: payload.parentType,
    parentId: payload.parentId,
    objectType: 'feed_message',
    sourceId: createdMessage.id,
  }, message);

  await messageRepository.update(createdMessage.id, { objectId: createdObject.id });

  const resourcePromises = [];

  if (payload.attachments) {
    resourcePromises.push(Promise.map(R.flatten([payload.attachments]), (attachment) =>
      attachmentService.create({
        parentType: 'feed_message',
        parentId: createdMessage.id,
        file: attachment }, message)));
  }

  if (payload.poll) {
    resourcePromises.push(impl.createPollResource(createdMessage, message)(payload.poll));
  }

  await Promise.all(resourcePromises);

  const objectWithSourceAndChildren = await objectService.getWithSourceAndChildren({
    objectId: createdObject.id,
  }, message);

  const networkId = R.ifElse(
    R.propEq('type', 'team'),
    R.prop('networkId'),
    R.prop('id'))(parent);

  FeedDispatcher.emit('message.created', {
    parent,
    networkId,
    actor: message.credentials,
    object: objectWithSourceAndChildren,
  });

  return objectWithSourceAndChildren;
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
export const like = async (payload, message) => {
  logger.info('Liking message', { payload, message });

  const messageToLike = await get({ messageId: payload.messageId }, message);
  if (!messageToLike) throw createError('404');

  await likeRepository.create(messageToLike.id, payload.userId);

  return {
    ...messageToLike,
    hasLiked: true,
    likesCount: messageToLike.likesCount + 1,
  };
};

/**
 * Deletes a message
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - The type of parent to create the object for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method remove
 * @return {external:Promise.<Boolean>}
 */
export const remove = async (payload, message) => {
  logger.info('Deleting message', { payload, message });

  // TODO ACL: Only an admin or the creator of the message can delete.

  await messageRepository.destroy(payload.messageId);
  await impl.removeAttachedObjects(payload.messageId);

  return true;
};
