import Boom from 'boom';
import { declineExchange } from 'modules/flexchange/repositories/exchange';

export default async (network, exchange, req) => {
  const { ResponseStatus } = exchange;
  const approved = ResponseStatus ? ResponseStatus.approved : null;

  if (approved === 0) throw Boom.badData('Your response is already rejected.');

  const declinedExchange = await declineExchange(exchange.id, req.auth.credentials.id);

  return declinedExchange;
};
