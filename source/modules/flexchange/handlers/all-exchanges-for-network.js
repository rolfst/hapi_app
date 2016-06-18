import { findExchangesByNetwork } from 'modules/flexchange/repositories/exchange';
import respondWithCollection from 'common/utils/respond-with-collection';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  if (hasIntegration(req.pre.network)) {
    // TODO: Execute integration logic with adapter
  }

  return findExchangesByNetwork(req.pre.network)
    .then(exchanges => reply(respondWithCollection(exchanges)));
};
