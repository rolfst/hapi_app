import Boom from 'boom';
import { acceptExchange } from 'modules/flexchange/repositories/exchange';
import * as notification from 'modules/flexchange/notifications/accepted-exchange';

export default async (network, exchange, req) => {
  const { ResponseStatus } = exchange;
  const approved = ResponseStatus ? ResponseStatus.approved : null;

  if (approved === 0) throw Boom.badData('Your response is already rejected.');

  const acceptedExchange = await acceptExchange(exchange.id, req.auth.credentials.id);
  notification.send(network, acceptedExchange, req.auth.credentials);

  return acceptedExchange;
};
