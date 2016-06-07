import { findNetworkById } from 'common/repositories/network';
import { findExchangesByNetwork } from 'modules/flexchange/repositories/exchange';
import respondWithCollection from 'common/utils/respond-with-collection';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  return findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    return findExchangesByNetwork(network)
      .then(exchanges => reply(respondWithCollection(exchanges)));
  });
};
