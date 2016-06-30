import Boom from 'boom';
import createAdapter from 'adapters/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';
import { acceptExchange } from 'modules/flexchange/repositories/exchange';
import * as notification from 'modules/flexchange/notifications/accepted-exchange';

export default async (network, exchange, req) => {
  const { artifacts, credentials } = req.auth;
  const { ResponseStatus } = exchange;
  const approved = ResponseStatus ? ResponseStatus.approved : null;

  if (hasIntegration(network)) {
    return createAdapter(network, artifacts.integrations).acceptExchange;
  }

  if (approved === 0) throw Boom.badData('Can\'t accept this exchange anymore.');

  const acceptedExchange = await acceptExchange(exchange.id, req.auth.credentials.id);
  notification.send(network, acceptedExchange, credentials);

  return acceptedExchange;
};
