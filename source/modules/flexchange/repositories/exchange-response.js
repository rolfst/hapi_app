const R = require('ramda');
const createExchangeResponseModel = require('../models/exchange-response');
const { ExchangeResponse } = require('./dao');

/**
 * @module modules/flexchange/repositories/exchange-response
 */

/**
 * Find an exchange response by exchange and user or throw Error
 * @param {object} constraint - object that contains fields and values for the database
 * @method findResponseWhere
 * @return {external:Promise} Find exchange response promise
 */
const findResponseWhere = (constraint) => {
  return ExchangeResponse.findOne({ where: constraint });
};

const findAllWhere = (whereConstraint) => ExchangeResponse
  .unscoped()
  .findAll({ where: whereConstraint })
  .then(R.map(createExchangeResponseModel));

/**
 * Find an accepted exchange response for a user
 * @param {string} userId - user to find the response for
 * @method findAcceptedExchangeResponsesForUser
 * @return {external:Promise} - Promise with accepted exchange responses
 */
function findAcceptedExchangeResponsesForUser(userId) {
  return ExchangeResponse.findAll({
    where: { userId, response: 1 },
  });
}

/**
 * Removes an exchange response for exchange and user
 * @param {string} exchangeId - Exchange the response is send to
 * @param {string} userId - User that placed the response
 * @method removeExchangeResponseForExchangeAndUser
 * @return {external:Promise} - Promise
 */
function removeExchangeResponseForExchangeAndUser(exchangeId, userId) {
  return ExchangeResponse.destroy({
    where: { exchangeId, userId },
  });
}

/**
 * Creates an exchange response
 * @param {object} data - User that placed the response
 * @method createExchangeResponse
 * @return {external:Promise} Find exchange response promise
 */
function createExchangeResponse(data) {
  return ExchangeResponse.create(data);
}

// exports of functions
module.exports = {
  createExchangeResponse,
  findAllWhere,
  findResponseWhere,
  removeExchangeResponseForExchangeAndUser,
};
