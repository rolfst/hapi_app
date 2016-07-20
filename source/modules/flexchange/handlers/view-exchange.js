import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import { findValuesForExchange } from 'modules/flexchange/repositories/exchange-value';
import respondWithItem from 'common/utils/respond-with-item';
import hasIntegration from 'common/utils/network-has-integration';

export default async (req, reply) => {
  if (hasIntegration(req.pre.network)) {
    // Execute integration logic with adapter
  }

  try {
    const exchange = await findExchangeById(req.params.exchangeId, req.auth.credentials.id);
    exchange.Values = await findValuesForExchange(exchange.ExchangeValues, exchange.type);

    return reply(respondWithItem(exchange));
  } catch (err) {
    console.log('Error while viewing an exchange: ', err);
    return reply(err);
  }
};
