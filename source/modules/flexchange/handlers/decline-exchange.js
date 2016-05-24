import { findExchangeById, declineExchange } from 'modules/flexchange/repositories/exchange';
import hasIntegration from 'common/utils/network-has-integration';
import createAdapter from 'adapters/create-adapter';

export default (network, req) => {
  if (hasIntegration(network)) {
    return createAdapter(network).declineExchange;
  }

  return findExchangeById(req.params.exchangeId)
    .then(exchange => {
      // TODO: Check if logged user may decline the exchange
      return declineExchange(exchange, req.auth.credentials);
    })
    .then(declinedExchange => {
      // TODO: Fire ExchangeWasDeclined event
      return declinedExchange;
    });
};
