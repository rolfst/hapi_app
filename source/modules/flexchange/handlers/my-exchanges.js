import { findNetworkById } from 'common/repositories/network';
import hasIntegration from 'common/utils/network-has-integration';
import respondWithCollection from 'common/utils/respond-with-collection';

export default (req, reply) => {
  findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    req.auth.credentials.getExchanges()
    .then(exchanges => reply(respondWithCollection(exchanges)));
  });
};
