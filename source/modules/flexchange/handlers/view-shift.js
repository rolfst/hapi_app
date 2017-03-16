const { omit } = require('lodash');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/viewShift');

export default async (req, reply) => {
  try {
    const payload = { shiftId: req.params.shiftId };
    const message = { ...req.pre, ...req.auth };

    logger.info('View shift', { payload, message });
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
