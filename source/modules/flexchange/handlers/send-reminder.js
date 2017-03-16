const Logger = require('../../../shared/services/logger');
const reminderService = require('../services/reminder');

const logger = Logger.createLogger('FLEXCHANGE/handler/sendReminder');


export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };

    logger.info('Sending reminder', { message });
    await reminderService.sendReminder(null);

    return reply({});
  } catch (err) {
    return reply(err);
  }
};
