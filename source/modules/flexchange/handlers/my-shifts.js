import { omit } from 'lodash';
import * as flexchangeService from '../services/flexchange';

const transformItem = item => ({
  ...omit(item, 'teamId', 'exchangeId'),
  exchange_id: item.exchangeId ? item.exchangeId.toString() : null,
  team_id: item.teamId ? item.teamId.toString() : null,
});

export default async (req, reply) => {
  const message = { ...req.pre, ...req.auth };

  try {
    const items = await flexchangeService.listMyShifts({}, message);
    const response = items.map(transformItem);

    return reply({ data: response });
  } catch (err) {
    return reply(err);
  }
};
