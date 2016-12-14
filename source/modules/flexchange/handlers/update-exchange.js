import { pick } from 'lodash';
import moment from 'moment';
import createError from '../../../shared/utils/create-error';
import camelCaseKeys from '../../../shared/utils/camel-case-keys';
import * as Logger from '../../../shared/services/logger';
import { updateExchangeById } from '../repositories/exchange';

const logger = Logger.createLogger('FLEXCHANGE/handler/updateExchange');

export default async (req, reply) => {
  try {
    const whitelist = pick(req.payload, 'title', 'description', 'start_time', 'end_time');
    const data = camelCaseKeys(whitelist);
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
