import Boom from 'boom';
import analytics from 'common/services/analytics';
import approveExchangeEvent from 'common/events/approve-exchange-event';
import { approveExchange } from 'modules/flexchange/repositories/exchange';
import { findExchangeResponseByExchangeAndUser } from '../repositories/exchange-response';
import * as creatorApproved from '../notifications/creator-approved';
import * as substituteApproved from '../notifications/substitute-approved';

export default async (network, exchange, req) => {
  if (!req.payload.user_id) throw Boom.badData('Missing user_id to approve.');
  const userIdToApprove = req.payload.user_id;

  const exchangeResponse = await findExchangeResponseByExchangeAndUser(exchange.id, userIdToApprove); // eslint-disable-line max-len

  if (exchangeResponse.approved) {
    throw Boom.badData('The user is already approved.');
  } else if (exchangeResponse.approved === 0) {
    throw Boom.badData('Cannot approve a rejected response.');
  } else if (!exchangeResponse.response) {
    throw Boom.badData('The user didn\'t accept the exchange.');
  }

  const approvedExchange = await approveExchange(exchange, req.auth.credentials, userIdToApprove);

  Promise.all([
    creatorApproved.send(exchange),
    substituteApproved.send(exchange),
  ]);

  analytics.track(approveExchangeEvent(network, approvedExchange));

  return approvedExchange;
};
