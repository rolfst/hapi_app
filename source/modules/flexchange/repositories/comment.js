const createError = require('../../../shared/utils/create-error');
const { ActivityTypes } = require('../../core/repositories/dao/activity');
const { createActivity } = require('../../core/repositories/activity');
const ExchangeComment = require('./dao/exchange-comment');

/**
 * @module modules/flexchange/repositories/comment
 */

/**
 * Find a specific exchange comment by id
 * @param {string} commentId - Id of the comment
 * @method findCommentById
 * @return {external:Promise} Find exchange comment promise
 */
export function findCommentById(commentId) {
  return ExchangeComment
    .findById(commentId)
    .then(comment => {
      if (!comment) throw createError('404');

      return comment;
    });
}

/**
 * Create an exchange comment
 * @param {string} exchangeId - Id of exchange the comment is being placed on
 * @param {object} textByUser - Object containing payload data
 * @param {string} textByUser.text - The comment text
 * @param {string} textByUser.userId - Id of the user placing the comment
 * @method createExchangeComment
 * @return {external:Promise} - Create exchange comment promise
 */
export async function createExchangeComment(exchangeId, { text, userId }) {
  const exchangeComment = await ExchangeComment.create({
    exchangeId,
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

/**
 * finds a comment for an exchange
 * @param {Exchange} exchange - Object containing payload data
 * @method findCommentsByExchange
 * @return {external:Promise} - Promise with list of all comments exchange comment promise
 */
export function findCommentsByExchange(exchange) {
  return exchange.getComments();
}
