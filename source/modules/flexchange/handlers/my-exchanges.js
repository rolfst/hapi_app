import { pick } from 'lodash';
import * as responseUtil from '../../../shared/utils/response';
import * as flexchangeService from '../services/flexchange';

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  const filter = pick(req.query, FILTER_PROPERTIES);
  const message = { ...req.pre, ...req.auth };
  const payload = { filter, userId: req.auth.credentials.id };

  try {
    const result = await flexchangeService.listPersonalizedExchanges(payload, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
