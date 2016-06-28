import Boom from 'boom';
import { findExchangeById, rejectExchange } from 'modules/flexchange/repositories/exchange';
import {
  findExchangeResponseByExchangeAndUser,
} from 'modules/flexchange/repositories/exchange-response';

export default async (network, req) => {
  if (!req.payload.user_id) throw Boom.badData('Missing user_id to reject.');
  const userIdToReject = req.payload.user_id;

  const exchange = await findExchangeById(req.params.exchangeId, req.auth.credentials.id);
  const exchangeResponse = await findExchangeResponseByExchangeAndUser(exchange.id, userIdToReject);

  if (exchangeResponse.approved) {
    throw Boom.badData('The user is already approved.');
  }

  if (!exchangeResponse.response) {
    throw Boom.badData('The user didn\'t accept the exchange.');
  }

  const rejectedExchange = await rejectExchange(exchange, userIdToReject);
  const reloadedExchange = await rejectedExchange.reload();
  // TODO: Fire ExchangeWasRejected event

  return reloadedExchange;
};
