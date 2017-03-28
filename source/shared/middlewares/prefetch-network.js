const R = require('ramda');
const networkService = require('../../modules/core/services/network');
const authorizationService = require('../../modules/core/services/authorization');
const createError = require('../utils/create-error');
const serverUtil = require('../utils/server');

const logger = require('../../shared/services/logger')('MIDDLEWARE/prefetchNetwork');

module.exports = async (req, reply) => {
  const message = R.merge(req.auth, req.pre);
  const payload = R.merge(req.params, req.payload, req.query);

  try {
    logger.debug('Fetching network', { payload, message });
    const network = await networkService.get(payload, message);
    await authorizationService.assertThatUserBelongsToTheNetwork({
      userId: message.credentials.id,
      networkId: network.id,
    });

    return reply(network);
  } catch (err) {
    logger.debug('Error while pre-fetching the network', { payload, message, err });

    if (!err.isBoom) return reply(createError('500'));
    const errorResponse = serverUtil.transformBoomToErrorResponse(err);

    return reply(errorResponse).takeover().code(errorResponse.status_code);
  }
};
