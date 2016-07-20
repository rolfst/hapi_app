import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import respondWithItem from 'common/utils/respond-with-item';
import hasIntegration from 'common/utils/network-has-integration';

export default async (req, reply) => {
  if (hasIntegration(req.pre.network)) {
    // Execute integration logic with adapter
  }

  try {
    const exchange = await findExchangeById(req.params.exchangeId, req.auth.credentials.id);

    return reply(respondWithItem(exchange));
  } catch (err) {
    console.log('Error viewing an exchange: ', err);

    return reply(err);
  }
};
