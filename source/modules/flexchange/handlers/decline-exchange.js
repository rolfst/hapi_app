import Boom from 'boom';
import { declineExchange } from 'modules/flexchange/repositories/exchange';
import createAdapter from 'adapters/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';

export default async (network, exchange, req) => {
  const { ResponseStatus } = exchange;
  const approved = ResponseStatus ? ResponseStatus.approved : null;

  if (hasIntegration(network)) {
    return createAdapter(network, req.auth.artifacts.integrations).declineExchange;
  }

  if (approved === 0) throw Boom.badData('Can\'t decline this exchange anymore.');

  const declinedExchange = await declineExchange(exchange.id, req.auth.credentials.id);

  return declinedExchange;
};
