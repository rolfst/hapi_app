const R = require('ramda');
const serverUtil = require('../utils/server');
const createError = require('../utils/create-error');
const authenticate = require('../utils/authenticate');

const logger = require('../../shared/services/logger')('SHARED/middleware/authenticatorStrategy');

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
      const myError = err;
      myError.artifacts = artifacts;
      logger.error('Error in Authenticator Strategy', myError);

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

