import { ExchangeResponse } from 'modules/flexchange/models';

/**
 * Find an exchange response by exchange and user
 * @param {Exchange} exchange - Exchange the response is send to
 * @param {number} userId - User that placed the response
 * @method findExchangeResponseByExchangeAndUser
 * @return {promise} Find exchange response promise
 */
export function findExchangeResponseByExchangeAndUser(exchange, userId) {
  return ExchangeResponse.findOne({
    where: {
      exchangeId: exchange.id,
      userId,
    },
  });
}

/**
 * Removes an exchange response for exchange and user
 * @param {Exchange} exchange - Exchange the response is send to
 * @param {User} user - User that placed the response
 * @method findExchangeResponseByExchangeAndUser
 * @return {promise} Find exchange response promise
 */
export function removeExchangeResponseForExchangeAndUser(exchange, user) {
  return ExchangeResponse.destroy({
    where: {
      exchangeId: exchange.id,
      userId: user.id,
    },
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
