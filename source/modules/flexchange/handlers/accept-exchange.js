import { findExchangeById, acceptExchange } from 'modules/flexchange/repositories/exchange';
import createAdapter from 'adapters/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';

export default (network, req) => {
  if (hasIntegration(network)) {
    return createAdapter(network, req.auth.artifacts.integrations).acceptExchange;
  }

  return findExchangeById(req.params.exchangeId, req.auth.credentials.id)
    .then(exchange => {
      // TODO: Check if logged user may accept the exchange
      return acceptExchange(exchange.id, req.auth.credentials.id)
        .then(() => exchange);
    })
    .then(acceptedExchange => {
      // TODO: Fire ExchangeWasAccepted event
      return acceptedExchange.reload();
    });
};
