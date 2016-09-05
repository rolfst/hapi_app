import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import * as responseUtil from 'common/utils/response';

export default async (req, reply) => {
  try {
    const exchange = await findExchangeById(req.params.exchangeId, req.auth.credentials.id);

    return reply({ data: responseUtil.serialize(exchange) });
  } catch (err) {
    return reply(err);
  }
};
