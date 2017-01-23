import R from 'ramda';
import * as responseUtils from '../../../shared/utils/response';
import * as flexchangeService from '../services/flexchange';

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params, filter: R.pick(FILTER_PROPERTIES, req.query) };
    const result = await flexchangeService.listExchangesForUser(payload, message);

    return reply({ data: responseUtils.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
