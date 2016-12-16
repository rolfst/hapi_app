import { pick } from 'lodash';
import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';
import * as flexchangeService from '../services/flexchange';

const logger = Logger.createLogger('FLEXCHANGE/handler/allExchangesForNetwork');

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  try {
    const { pre, auth, query } = req;
    const message = { ...pre, ...auth };
    const filter = pick(query, FILTER_PROPERTIES);
    const payload = { filter };

    logger.info('Listing all exchanges for network', { message, payload });
    const result = await flexchangeService.listExchangesForNetwork(payload, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
