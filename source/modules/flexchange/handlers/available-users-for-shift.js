import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';
import * as flexchangeService from '../services/flexchange';

const logger = Logger.getLogger('FLEXCHANGE/handler/availableUsersForShift');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params, ...req.query };

    logger.info('Lising all available users for shift', { message, payload });
    const response = await flexchangeService.listAvailableUsersForShift(payload, message);

    return reply({ data: responseUtil.toSnakeCase(response) });
  } catch (err) {
    return reply(err);
  }
};
