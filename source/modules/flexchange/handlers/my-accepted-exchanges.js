import { pick } from 'lodash';
import * as Logger from '../../../shared/services/logger';
import * as responseUtil from '../../../shared/utils/response';
import * as flexchangeService from '../services/flexchange';

const logger = Logger.getLogger('FLEXCHANGE/handler/myAcceptedExchanges');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const FILTER_PROPERTIES = ['start', 'end'];
    const payload = { filter: pick(req.query, FILTER_PROPERTIES) };

    logger.info('Listing my accepted exchanges', { message, payload });
    const exchanges = await flexchangeService.listMyAcceptedExchanges(payload, message);

    return reply({ data: responseUtil.serialize(exchanges) });
  } catch (err) {
    return reply(err);
  }
};
