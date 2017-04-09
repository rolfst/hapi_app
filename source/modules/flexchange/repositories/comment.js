const R = require('ramda');
const createError = require('../../../shared/utils/create-error');
const { ActivityTypes } = require('../../core/repositories/dao/activity');
const { createActivity } = require('../../core/repositories/activity');
const ExchangeComment = require('./dao/exchange-comment');
const createExchangeCommentModel = require('../models/exchange-comment');

/**
 * @module modules/flexchange/repositories/comment
 */

/**
 * Find a specific exchange comment by id
 * @param {string} commentId - Id of the comment
 * @method findCommentById
 * @return {external:Promise} Find exchange comment promise
 */
function findCommentById(commentId) {
  return ExchangeComment
    .findById(commentId)
    .then((comment) => {
      if (!comment) throw createError('404');

      return createExchangeCommentModel(comment);
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
async function createExchangeComment(exchangeId, { text, userId }) {
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
function findCommentsByExchange(exchange) {
  return ExchangeComment.findAll({ where: { exchangeId: exchange.id } });
  // return exchange.getComments();
}

function findBy(attributes) {
  return ExchangeComment.findAll({ where: attributes })
    .then((comments) => R.map(createExchangeCommentModel, comments));
}

exports.createExchangeComment = createExchangeComment;
exports.findCommentById = findCommentById;
exports.findCommentsByExchange = findCommentsByExchange;
exports.findBy = findBy;
