import { pick } from 'lodash';
import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';
import * as flexchangeService from '../services/flexchange';

const logger = Logger.createLogger('FLEXCHANGE/handler/createExchangeComment');

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...pick(req.params, ['exchangeId']), ...pick(req.payload, ['text']) };
    payload.filter = pick(req.query, FILTER_PROPERTIES);

    logger.info('Creating exchange comment', { message, payload });
    const exchangeComment = await flexchangeService.getExchangeComment(payload, message);

    return reply({ success: true, data: responseUtil.serialize(exchangeComment) });
  } catch (err) {
    return reply(err);
  }
};
