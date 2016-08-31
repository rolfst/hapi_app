import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import { findCommentsByExchange } from 'modules/flexchange/repositories/comment';
import respondWithCollection from 'common/utils/respond-with-collection';

export default async (req, reply) => {
  try {
    const exchange = await findExchangeById(req.params.exchangeId, req.auth.credentials.id);
    const comments = await findCommentsByExchange(exchange);

    return reply(respondWithCollection(comments));
  } catch (err) {
    return reply(err);
  }
};
