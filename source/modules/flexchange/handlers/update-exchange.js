import { pick } from 'lodash';
import moment from 'moment';
import Boom from 'boom';
import camelCaseKeys from 'common/utils/camel-case-keys';
import { updateExchangeById } from 'modules/flexchange/repositories/exchange';

export default async (req, reply) => {
  try {
    const whitelist = pick(req.payload, 'title', 'description', 'start_time', 'end_time');
    const data = camelCaseKeys(whitelist);

    if (data.startTime && data.endTime && moment(data.endTime).isBefore(data.startTime)) {
      throw Boom.badData('end_time should be after start_time');
    }

    const exchange = await updateExchangeById(req.params.exchangeId, data);
    const updatedExchange = await exchange.reload();

    return reply({ success: true, data: updatedExchange.toJSON() });
  } catch (err) {
    console.log('Error updating exchange:', err);

    return reply(err);
  }
};
