import { findExchangesByUser } from 'modules/flexchange/repositories/exchange';
import respondWithCollection from 'common/utils/respond-with-collection';

export default async (req, reply) => {
  const exchanges = await findExchangesByUser(req.auth.credentials);

  return reply(respondWithCollection(exchanges));
};
