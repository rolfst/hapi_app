import Boom from 'boom';
import { findExchangeById, approveExchange } from 'modules/flexchange/repositories/exchange';
import {
  findExchangeResponseByExchangeAndUser,
} from 'modules/flexchange/repositories/exchange-response';

export default (network, req) => {
  if (!req.payload.user_id) throw Boom.badData('Missing user_id to approve.');
  const userIdToApprove = req.payload.user_id;

  return findExchangeById(req.params.exchangeId, req.auth.credentials.id)
    .then(exchange => {
      // TODO: Check if logged user may approve the exchange
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

      return approveExchange(exchange, req.auth.credentials, userIdToApprove);
    })
    .then(exchange => {
      // TODO: Fire ExchangeWasApproved event
      return exchange.reload();
    });
};
