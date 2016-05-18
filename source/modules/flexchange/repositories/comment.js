import Boom from 'boom';
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
export function createExchangeComment(exchangeId, { text, userId }) {
  return ExchangeComment.create({
    parentId: exchangeId,
    parentType: 'FlexAppeal\\Entities\\Exchange',
    text,
    createdBy: userId,
  });
}
