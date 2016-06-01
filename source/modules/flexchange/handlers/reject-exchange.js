import Boom from 'boom';
import { findExchangeById, rejectExchange } from 'modules/flexchange/repositories/exchange';
import {
  findExchangeResponseByExchangeAndUser,
} from 'modules/flexchange/repositories/exchange-response';

export default (network, req) => {
  if (!req.payload.user_id) throw Boom.badData('Missing user_id to approve.');
  const userIdToApprove = req.payload.user_id;

  return findExchangeById(req.params.exchangeId, req.auth.credentials.id)
    .then(exchange => {
      // TODO: Check if logged user may reject the exchange
      return findExchangeResponseByExchangeAndUser(exchange.id, userIdToApprove)
        .then(exchangeResponse => ([exchangeResponse, exchange]));
    })
    .then(([exchangeResponse, exchange]) => {
      if (exchangeResponse.approved) {
        throw Boom.badData('The user is already approved.');
      }

      if (!exchangeResponse.response) {
        throw Boom.badData('The user didn\'t accept the exchange.');
      }

      return rejectExchange(exchange, userIdToApprove);
    })
    .then(rejectedExchange => {
      // TODO: Fire ExchangeWasRejected event
      return rejectedExchange.reload();
    });
};
