import { pick } from 'lodash';
import * as flexchangeService from '../services/flexchange';
import * as responseUtil from 'common/utils/response';

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  const message = { ...req.pre, ...req.auth };
  const payload = { ...pick(req.params, ['exchangeId']) };
  payload.filter = pick(req.query, FILTER_PROPERTIES);

  try {
    const activities = await flexchangeService.listActivities(payload, message);

    return reply({ data: responseUtil.serialize(activities) });
  } catch (err) {
    return reply(err);
  }
};
