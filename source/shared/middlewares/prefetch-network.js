import * as Logger from '../../shared/services/logger';
import * as networkService from '../../modules/core/services/network';
import createError from '../utils/create-error';
import * as serverUtil from '../utils/server';

const logger = Logger.createLogger('MIDDLEWARE/prefetchNetwork');

export default async (req, reply) => {
  const message = { ...req.auth };
  const payload = { ...req.params };

  try {
    logger.info('Fetching network', { payload, message });
    const network = await networkService.getNetwork(payload, message);

    return reply(network);
  } catch (err) {
    logger.info('Error while pre-fetching the network', { payload, message });

    if (!err.isBoom) return reply(createError('500'));
    const errorResponse = serverUtil.transformBoomToErrorResponse(err);

    return reply(errorResponse).takeover().code(errorResponse.status_code);
  }
};
