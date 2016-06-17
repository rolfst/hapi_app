import { findExchangeById, acceptExchange } from 'modules/flexchange/repositories/exchange';
import createAdapter from 'adapters/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';

export default async (network, req) => {
  if (hasIntegration(network)) {
    return createAdapter(network, req.auth.artifacts.integrations).acceptExchange;
  }

  const exchange = await findExchangeById(req.params.exchangeId, req.auth.credentials.id);
  await acceptExchange(exchange.id, req.auth.credentials.id);

  // TODO: Fire ExchangeWasAccepted event
  return exchange.reload();
};
