const R = require('ramda');
const { pick } = require('lodash');
const tokenUtil = require('../utils/token');
const serverUtil = require('../utils/server');
const createError = require('../utils/create-error');
const userRepo = require('../../modules/core/repositories/user');
const Logger = require('../../shared/services/logger');

const logger = Logger.createLogger('SHARED/middleware/authenticatorStrategy');

const authenticate = async (networkId, token = null) => {
  if (!token) throw createError('401');

  const { sub: userId, integrations } = tokenUtil.decode(token);
  // TODO the user should be retrieved via the service
  const user = await userRepo.findUserById(userId, null, false);

  return {
    credentials: pick(user, 'id', 'username', 'fullName', 'email', 'firstName', 'lastName'),
    artifacts: { integrations },
  };
};

module.exports = () => ({
  async authenticate(request, reply) {
    let artifacts = { requestId: request.id };

    try {
      const { networkId } = request.params;
      const token = request.raw.req.headers['x-api-token'];
      const authenticationResult = await authenticate(networkId, token);

      artifacts = R.merge(artifacts, authenticationResult.artifacts);
      artifacts.authenticationToken = token;

      return reply.continue({ credentials: authenticationResult.credentials, artifacts });
    } catch (err) {
      const message = { artifacts };
      logger.error('Error in Authenticator Strategy', { err, message });

      // This is to make old API logic backwards compatible with clients
      // that have not updated yet.
      if (request.url.path.includes('v1/chats')) {
        return reply(createError('403', 'Could not authenticate.')).takeover().code(403);
      }

      const errorResponse = serverUtil.transformBoomToErrorResponse(
        !err.isBoom ? createError('401') : err);

      return reply(errorResponse).takeover().code(errorResponse.status_code);
    }
  },
});

