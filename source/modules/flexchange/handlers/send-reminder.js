const createServicePayload = require('../../../shared/utils/create-service-payload');
const Logger = require('../../../shared/services/logger');
const reminderService = require('../services/reminder');

const logger = Logger.createLogger('FLEXCHANGE/handler/sendReminder');


module.exports = async (req, reply) => {
  try {
    const { message } = createServicePayload(req);

    logger.info('Sending reminder', { message });
    await reminderService.sendReminder(null);

    return reply({});
  } catch (err) {
    return reply(err);
  }
};
