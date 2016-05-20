import { ExchangeResponse } from 'modules/flexchange/models';

/**
 * Find an exchange response by exchange and user
 * @param {Exchange} exchange - Exchange the response is send to
 * @param {User} user - User that placed the response
 * @method findExchangeResponseByExchangeAndUser
 * @return {promise} Find exchange response promise
 */
export function findExchangeResponseByExchangeAndUser(exchange, user) {
  return ExchangeResponse.findOne({
    where: {
      exchangeId: exchange.id,
      userId: user.id,
    },
  });
}
