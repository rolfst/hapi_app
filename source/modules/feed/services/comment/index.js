const Logger = require('../../../../shared/services/logger');
const createError = require('../../../../shared/utils/create-error');
const messageRepository = require('../../repositories/message');
const commentRepository = require('../../repositories/comment');

/**
 * @module modules/feed/services/comment
 */

const logger = Logger.getLogger('FEED/service/comment');

/**
 * List comments
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.commentIds - The ids of comment to retrieve
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Comment[]>} {@link module:modules/feed~Comment}
 */
const list = async (payload, message) => {
  logger.info('List comments', { payload, message });

  return commentRepository.findBy({
    id: { $in: payload.commentIds },
  });
};

/**
 * Creates a comment for feed message
 * @param {object} payload - Object containing payload data
 * @param {string} payload.messageId - The id of the message to comment on
 * @param {string} payload.userId - The id of the creator of the comment
 * @param {string} payload.text - The text of the message
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Comment>} {@link module:modules/feed~Comment}
 */
const create = async (payload, message) => {
  logger.info('Creating comment for feed message', { payload, message });

  const messageToComment = await messageRepository.findById(payload.messageId);
  if (!messageToComment) throw createError('404', 'Message not found.');

  return commentRepository.create({
    messageId: payload.messageId,
    userId: payload.userId,
    text: payload.text,
  });
};

exports.create = create;
exports.list = list;
