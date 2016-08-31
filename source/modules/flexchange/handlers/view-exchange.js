import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import respondWithItem from 'common/utils/respond-with-item';

export default async (req, reply) => {
  try {
    const exchange = await findExchangeById(req.params.exchangeId, req.auth.credentials.id);

    return reply(respondWithItem(exchange));
  } catch (err) {
    return reply(err);
  }
};
