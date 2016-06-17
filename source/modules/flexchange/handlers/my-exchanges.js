import { findExchangesByUser } from 'modules/flexchange/repositories/exchange';
import respondWithCollection from 'common/utils/respond-with-collection';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  if (hasIntegration(req.pre.network)) {
    // TODO: Get exchanges from integration.
  }

  return findExchangesByUser(req.auth.credentials)
    .then(exchanges => reply(respondWithCollection(exchanges)));
};
