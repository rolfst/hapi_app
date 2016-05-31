import { findExchangeById, acceptExchange } from 'modules/flexchange/repositories/exchange';
import hasIntegration from 'common/utils/network-has-integration';
import createAdapter from 'adapters/create-adapter';

export default (network, req) => {
  if (hasIntegration(network)) {
    return createAdapter(network).acceptExchange;
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
