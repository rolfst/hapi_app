import { ExchangeResponse } from '../models';

/**
 * Find an exchange response by exchange and user or throw Error
 * @param {object} constraint - object that contains fields and values for the database
 * @method findResponseWhere
 * @return {promise} Find exchange response promise
 */
export const findResponseWhere = (constraint) => {
  return ExchangeResponse.findOne({ where: constraint });
};

export function findAcceptedExchangeResponsesForUser(userId) {
  return ExchangeResponse.findAll({
    where: { userId, response: 1 },
  });
}

/**
 * Removes an exchange response for exchange and user
 * @param {number} exchangeId - Exchange the response is send to
 * @param {number} userId - User that placed the response
 * @method removeExchangeResponseForExchangeAndUser
 * @return {promise} Find exchange response promise
 */
export function removeExchangeResponseForExchangeAndUser(exchangeId, userId) {
  return ExchangeResponse.destroy({
    where: { exchangeId, userId },
  });
}

/**
 * Creates an exchange response
 * @param {object} data - User that placed the response
 * @method createExchangeResponse
 * @return {promise} Find exchange response promise
 */
export function createExchangeResponse(data) {
  return ExchangeResponse.create(data);
}
