import { findNetworkById } from 'common/repositories/network';
import { findExchangesByUser } from 'modules/flexchange/repositories/exchange';
import respondWithCollection from 'common/utils/respond-with-collection';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  return findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      // TODO: Get exchanges from integration.
    }

    return findExchangesByUser(req.auth.credentials)
      .then(exchanges => reply(respondWithCollection(exchanges)));
  });
};
