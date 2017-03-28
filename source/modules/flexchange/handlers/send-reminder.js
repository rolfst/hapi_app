const createServicePayload = require('../../../shared/utils/create-service-payload');
const reminderService = require('../services/reminder');

const logger = require('../../../shared/services/logger')('FLEXCHANGE/handler/sendReminder');


module.exports = async (req, reply) => {
  try {
    const { message } = createServicePayload(req);

    logger.debug('Sending reminder', { message });
    await reminderService.sendReminder(null);

    return reply({});
  } catch (err) {
    return reply(err);
  }
};
