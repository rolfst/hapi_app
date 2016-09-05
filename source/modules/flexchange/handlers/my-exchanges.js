import { findExchangesByUser } from 'modules/flexchange/repositories/exchange';
import * as responseUtil from 'common/utils/response';

export default async (req, reply) => {
  const exchanges = await findExchangesByUser(req.auth.credentials);

  return reply({ data: responseUtil.serialize(exchanges) });
};
