import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import respondWithItem from 'common/utils/respond-with-item';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  if (hasIntegration(req.pre.network)) {
    // Execute integration logic with adapter
  }

  findExchangeById(req.params.exchangeId, req.auth.credentials.id)
    .then(exchange => reply(respondWithItem(exchange)))
    .catch(err => reply(err));
};
