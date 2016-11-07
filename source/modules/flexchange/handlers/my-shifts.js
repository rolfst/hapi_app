import { omit } from 'lodash';
import * as Logger from '../../../shared/services/logger';
import * as flexchangeService from '../services/flexchange';

const logger = Logger.getLogger('FLEXCHANGE/handler/myShifts');

const transformItem = item => ({
  ...omit(item, 'teamId', 'exchangeId'),
  exchange_id: item.exchangeId ? item.exchangeId.toString() : null,
  team_id: item.teamId ? item.teamId.toString() : null,
});

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };

    logger.info('Listing personal shifts', { message });
    const items = await flexchangeService.listMyShifts({}, message);
    const response = items.map(transformItem);

    return reply({ data: response });
  } catch (err) {
    return reply(err);
  }
};
