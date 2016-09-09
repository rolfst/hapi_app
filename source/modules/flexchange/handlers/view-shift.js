import { omit } from 'lodash';
import * as flexchangeService from '../services/flexchange';

export default async (req, reply) => {
  const payload = { shiftId: req.params.shiftId };
  const message = { ...req.pre, ...req.auth };

  try {
    const result = await flexchangeService.getShift(payload, message);
    const response = {
      ...omit(result, 'teamId', 'exchangeId'),
      exchange_id: result.exchangeId,
      team_id: result.teamId,
    };

    return reply({ data: response });
  } catch (err) {
    return reply(err);
  }
};
