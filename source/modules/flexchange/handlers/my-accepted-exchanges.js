import {
  findAcceptedExchangeResponsesForUser,
} from 'modules/flexchange/repositories/exchange-response';
import { findExchangeByIds } from 'modules/flexchange/repositories/exchange';
import * as responseUtil from 'common/utils/response';

export default async (req, reply) => {
  const responses = await findAcceptedExchangeResponsesForUser(req.auth.credentials.id);
  const exchanges = await findExchangeByIds(responses.map(r => r.exchangeId));

  return reply({ data: responseUtil.serialize(exchanges) });
};
