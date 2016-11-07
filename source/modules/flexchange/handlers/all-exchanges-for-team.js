import { pick } from 'lodash';
import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';
import * as flexchangeService from '../services/flexchange';

const logger = Logger.getLogger('FLEXCHANGE/handler/allExchangesForTeam');

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...pick(req.params, ['teamId']) };
    payload.filter = pick(req.query, FILTER_PROPERTIES);

    logger.info('Listing all exchanges for team', { payload, message });
    const exchanges = await flexchangeService.listExchangesForTeam(payload, message);

    return reply({ data: responseUtil.serialize(exchanges) });
  } catch (err) {
    return reply(err);
  }
};
