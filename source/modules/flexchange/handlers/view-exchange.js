import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import respondWithItem from 'common/utils/respond-with-item';

export default (req, reply) => {
  // TODO: Add authorization if user can access the network
  // TODO: Get exchange by id
  findExchangeById(req.params.exchangeId)
    .then(exchange => reply(respondWithItem(exchange)));
};
