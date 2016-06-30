import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import { findCommentsByExchange } from 'modules/flexchange/repositories/comment';
import respondWithCollection from 'common/utils/respond-with-collection';

export default (req, reply) => {
  return findExchangeById(req.params.exchangeId, req.auth.credentials.id)
    .then(exchange => findCommentsByExchange(exchange))
    .then(comments => reply(respondWithCollection(comments)))
    .catch(err => reply(err));
};
