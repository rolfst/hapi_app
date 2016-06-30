import Boom from 'boom';
import analytics from 'common/services/analytics';
import approveExchangeEvent from 'common/events/approve-exchange-event';
import { approveExchange } from 'modules/flexchange/repositories/exchange';
import {
  findExchangeResponseByExchangeAndUser,
} from 'modules/flexchange/repositories/exchange-response';

export default async (network, exchange, req) => {
  if (!req.payload.user_id) throw Boom.badData('Missing user_id to approve.');
  const userIdToApprove = req.payload.user_id;

  const exchangeResponse = await findExchangeResponseByExchangeAndUser(exchange.id, userIdToApprove); // eslint-disable-line max-len

  if (exchangeResponse.approved === 0) {
    throw Boom.badData('Cannot approve a rejected response.');
  }

  if (!exchangeResponse.response) {
    throw Boom.badData('The user didn\'t accept the exchange.');
  }

  const approvedExchange = await approveExchange(exchange, req.auth.credentials, userIdToApprove);
  const reloadedExchange = await approvedExchange.reload();

  analytics.track(approveExchangeEvent(network, reloadedExchange));

  return reloadedExchange;
};
