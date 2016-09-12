import { omit } from 'lodash';
import * as flexchangeService from '../services/flexchange';

export default async (req, reply) => {
  const payload = { shiftId: req.params.shiftId };
  const message = { ...req.pre, ...req.auth };

  try {
    const result = await flexchangeService.getShift(payload, message);
    const response = {
      ...omit(result, 'teamId', 'exchangeId'),
      exchange_id: result.exchangeId ? result.exchangeId.toString() : null,
      team_id: result.teamId ? result.teamId.toString() : null,
    };

    return reply({ data: response });
  } catch (err) {
    return reply(err);
  }
};
