const createServicePayload = require('../../../shared/utils/create-service-payload');
const moment = require('moment');
const createError = require('../../../shared/utils/create-error');
const { updateExchangeById } = require('../repositories/exchange');

const logger = require('../../../shared/services/logger')('FLEXCHANGE/handler/updateExchange');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const data = {
      title: payload.title,
      description: payload.description,
      startTime: payload.startTime,
      endTime: payload.endTime,
    };

    if (data.startTime && data.endTime && moment(data.endTime).isBefore(data.startTime)) {
      throw createError('422', 'Attribute end_time should be after start_time');
    }

    logger.debug('Updating exchange', { payload, message });
    const exchange = await updateExchangeById(payload.exchangeId, data);
    const updatedExchange = await exchange.reload();

    return reply({ success: true, data: updatedExchange.toJSON() });
  } catch (err) {
    return reply(err);
  }
};
