import Boom from 'boom';
import { ExchangeResponse } from 'modules/flexchange/models';

/**
 * Find an exchange response by exchange and user
 * @param {number} exchangeId - Exchange the response is send to
 * @param {number} userId - User that placed the response
 * @method findExchangeResponseByExchangeAndUser
 * @return {promise} Find exchange response promise
 */
export function findExchangeResponseByExchangeAndUser(exchangeId, userId) {
  return ExchangeResponse.findOne({
    where: { exchangeId, userId },
  }).then(response => {
    if (!response) throw Boom.badData('No response found for the user.');

    return response;
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
