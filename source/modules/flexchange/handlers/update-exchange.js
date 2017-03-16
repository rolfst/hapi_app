const moment = require('moment');
const createError = require('../../../shared/utils/create-error');
const Logger = require('../../../shared/services/logger');
const { updateExchangeById } = require('../repositories/exchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/updateExchange');

export default async (req, reply) => {
  try {
    const data = {
      title: req.payload.title,
      description: req.payload.description,
      startTime: req.payload.start_time,
      endTime: req.payload.end_time,
    };
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params, ...req.payload };

    if (data.startTime && data.endTime && moment(data.endTime).isBefore(data.startTime)) {
      throw createError('422', 'Attribute end_time should be after start_time');
    }

    logger.info('Updating exchange', { payload, message });
    const exchange = await updateExchangeById(req.params.exchangeId, data);
    const updatedExchange = await exchange.reload();

    return reply({ success: true, data: updatedExchange.toJSON() });
  } catch (err) {
    return reply(err);
  }
};
