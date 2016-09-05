import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import { findCommentsByExchange } from 'modules/flexchange/repositories/comment';
import * as responseUtil from 'common/utils/response';

export default async (req, reply) => {
  try {
    const exchange = await findExchangeById(req.params.exchangeId, req.auth.credentials.id);
    const comments = await findCommentsByExchange(exchange);

    return reply({ data: responseUtil.serialize(comments) });
  } catch (err) {
    return reply(err);
  }
};
