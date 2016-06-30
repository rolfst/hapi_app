import Boom from 'boom';
import { acceptExchange } from 'modules/flexchange/repositories/exchange';
import createAdapter from 'adapters/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';

export default async (network, exchange, req) => {
  if (hasIntegration(network)) {
    return createAdapter(network, req.auth.artifacts.integrations).acceptExchange;
  }

  if (exchange.ResponseStatus.approved === 0) throw Boom.badData('Can\'t accept this exchange anymore.');

  await acceptExchange(exchange.id, req.auth.credentials.id);

  // TODO: Fire ExchangeWasAccepted event
  return exchange.reload();
};
