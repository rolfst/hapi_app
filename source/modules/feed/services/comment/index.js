import * as Logger from '../../../../shared/services/logger';
import * as commentRepository from '../../repositories/comment';

/**
 * @module modules/feed/services/comment
 */

const logger = Logger.getLogger('FEED/service/comment');

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
export const create = async (payload, message) => {
  logger.info('Creating comment for feed message', { payload, message });

  return commentRepository.create({
    messageId: payload.messageId,
    userId: payload.userId,
    text: payload.text,
  });
};
