import { pick } from 'lodash';
import * as flexchangeService from '../services/flexchange';
import * as responseUtil from 'shared/utils/response';

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  const message = { ...req.pre, ...req.auth };
  const payload = { ...pick(req.params, ['teamId']) };
  payload.filter = pick(req.query, FILTER_PROPERTIES);

  try {
    const exchanges = await flexchangeService.listExchangesForTeam(payload, message);

    return reply({ data: responseUtil.serialize(exchanges) });
  } catch (err) {
    return reply(err);
  }
};
