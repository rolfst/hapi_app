import { pick } from 'lodash';
import * as responseUtil from 'common/utils/response';
import * as flexchangeService from '../services/flexchange';

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  const message = { ...req.pre, ...req.auth };
  const payload = pick(req.params, ['shiftId']);
  payload.filter = pick(req.query, FILTER_PROPERTIES);

  try {
    const response = await flexchangeService.listAvailableUsersForShift(payload, message);

    return reply({ data: responseUtil.serialize(response) });
  } catch (err) {
    return reply(err);
  }
};
