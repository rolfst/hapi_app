import { declineExchange } from 'modules/flexchange/repositories/exchange';
import createAdapter from 'adapters/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';

export default async (network, exchange, req) => {
  if (hasIntegration(network)) {
    return createAdapter(network, req.auth.artifacts.integrations).declineExchange;
  }

  if (exchange.ResponseStatus.approved === 0) throw Boom.badData('Can\'t decline this exchange anymore.');

  await declineExchange(exchange.id, req.auth.credentials.id);

  return exchange.reload();
};
