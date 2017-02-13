import * as Logger from '../../shared/services/logger';
import * as networkService from '../../modules/core/services/network';
import * as authorizationService from '../../modules/core/services/authorization';
import createError from '../utils/create-error';
import * as serverUtil from '../utils/server';

const logger = Logger.createLogger('MIDDLEWARE/prefetchNetwork');

export default async (req, reply) => {
  try {
    const message = { ...req.auth };
    const payload = { id: req.params.networkId };

    logger.info('Fetching network', { payload, message });
    const network = await networkService.getNetwork(payload, message);
    await authorizationService.assertThatUserBelongsToTheNetwork({
      userId: message.credentials.id,
      networkId: network.id,
    });

    return reply(network);
  } catch (err) {
    if (!err.isBoom) return reply(createError('500'));

    const errorResponse = serverUtil.transformBoomToErrorResponse(err);

    return reply(errorResponse).takeover().code(errorResponse.status_code);
  }
};
