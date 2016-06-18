import { findExchangeById, declineExchange } from 'modules/flexchange/repositories/exchange';
import createAdapter from 'adapters/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';

export default (network, req) => {
  if (hasIntegration(network)) {
    return createAdapter(network, req.auth.artifacts.integrations).declineExchange;
  }

  return findExchangeById(req.params.exchangeId, req.auth.credentials.id)
    .then(exchange => {
      // TODO: Check if logged user may decline the exchange
      return declineExchange(exchange.id, req.auth.credentials.id)
        .then(() => exchange);
    })
    .then(exchange => {
      // TODO: Fire ExchangeWasDeclined event
      return exchange.reload();
    });
};
