const createServicePayload = require('../../../shared/utils/create-service-payload');
const R = require('ramda');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/viewShift');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.info('View shift', { payload, message });
    const result = await flexchangeService.getShift(payload, message);
    const response = R.merge(R.omit(['teamId', 'exchangeId'], result),
      {
        exchange_id: result.exchangeId ? result.exchangeId.toString() : null,
        team_id: result.teamId ? result.teamId.toString() : null,
      });

    return reply({ data: response });
  } catch (err) {
    return reply(err);
  }
};
