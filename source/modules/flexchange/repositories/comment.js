import Boom from 'boom';
import { ActivityTypes } from 'common/models/activity';
import { createActivity } from 'common/repositories/activity';
import ExchangeComment from 'modules/flexchange/models/exchange-comment';

/**
 * Find a specific exchange comment by id
 * @param {number} commentId - Id of the comment
 * @method findCommentById
 * @return {promise} Find exchange comment promise
 */
export function findCommentById(commentId) {
  return ExchangeComment
    .findById(commentId)
    .then(comment => {
      if (!comment) return Boom.notFound(`No comment found with id ${commentId}.`);

      return comment;
    });
}

/**
 * Create an exchange comment
 * @param {number} exchangeId - Id of exchange the comment is being placed on
 * @param {object} - Object containing payload data
   * @param {string} text - The comment text
   * @param {number} userId - Id of the user placing the comment
 * @method createExchangeComment
 * @return {promise} - Create exchange comment promise
 */
export async function createExchangeComment(exchangeId, { text, userId }) {
  const exchangeComment = await ExchangeComment.create({
    parentId: exchangeId,
    parentType: 'FlexAppeal\\Entities\\Exchange',
    text,
    createdBy: userId,
  });

  await createActivity({
    activityType: ActivityTypes.EXCHANGE_COMMENT,
    userId,
    sourceId: exchangeId,
    metaData: {
      comment_id: exchangeComment.id,
    },
  });

  return exchangeComment;
}

export function findCommentsByExchange(exchange) {
  return exchange.getComments();
}
