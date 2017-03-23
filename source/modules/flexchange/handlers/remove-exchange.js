const createServicePayload = require('../../../shared/utils/create-service-payload');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/removeExchanges');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.info('Deleting exchange', { payload, message });
    await flexchangeService.deleteExchange(payload);

    return reply({ success: true });
  } catch (err) {
    return reply(err);
  }
};
