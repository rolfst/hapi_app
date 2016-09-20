import { pick } from 'lodash';
import * as responseUtil from '../../../shared/utils/response';
import * as flexchangeService from '../services/flexchange';

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  const filter = pick(req.query, FILTER_PROPERTIES);
  const message = { ...req.pre, ...req.auth };
  const payload = { filter };

  try {
    const result = await flexchangeService.listExchangesForUser(payload, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
