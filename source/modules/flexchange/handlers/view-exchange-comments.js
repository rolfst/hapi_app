import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import respondWithCollection from 'common/utils/respond-with-collection';

export default (req, reply) => {
  findExchangeById(req.params.exchangeId)
    .then(exchange => exchange.getExchangeComments())
    .then(comments => reply(respondWithCollection(comments)))
    .catch(err => reply(err));
};
