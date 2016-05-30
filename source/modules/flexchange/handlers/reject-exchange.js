import Boom from 'boom';
import { findExchangeById, rejectExchange } from 'modules/flexchange/repositories/exchange';
import {
  findExchangeResponseByExchangeAndUser,
} from 'modules/flexchange/repositories/exchange-response';

export default (network, req) => {
  if (!req.payload.user_id) throw Boom.badData('Missing user_id to approve.');
  const userIdToApprove = req.payload.user_id;

  return findExchangeById(req.params.exchangeId)
    .then(exchange => {
      // TODO: Check if logged user may reject the exchange
      const exchangeResponse = findExchangeResponseByExchangeAndUser(exchange.id, userIdToApprove);
      return [exchangeResponse, exchange];
    })
    .spread((exchangeResponse, exchange) => {
      if (exchangeResponse.approved) {
        throw Boom.badData('The user is already approved.');
      }

      if (exchangeResponse.approved === 0) {
        throw Boom.badData('The user is already rejected.');
      }

      if (!exchangeResponse.response) {
        throw Boom.badData('The user didn\'t accept the exchange.');
      }

      return rejectExchange(exchange, userIdToApprove);
    })
    .then(exchange => {
      // TODO: Fire ExchangeWasRejected event
      return exchange;
    });
};
