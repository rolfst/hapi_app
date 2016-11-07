import { pick } from 'lodash';
import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';
import * as flexchangeService from '../services/flexchange';

const logger = Logger.getLogger('FLEXCHANGE/handler/myExchanges');

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  try {
    const filter = pick(req.query, FILTER_PROPERTIES);
    const message = { ...req.pre, ...req.auth };
    const payload = { filter, userId: req.auth.credentials.id };

    logger.info('Listing my exchanges', { payload, message });
    const result = await flexchangeService.listPersonalizedExchanges(payload, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
