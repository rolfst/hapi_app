import { pick } from 'lodash';
import tokenUtil from '../utils/token';
import * as serverUtil from '../utils/server';
import createError from '../utils/create-error';
import * as userRepo from '../../modules/core/repositories/user';
import * as Logger from '../../shared/services/logger';

const logger = Logger.getLogger('SHARED/middleware/authenticatorStrategy');

export const authenticate = async (networkId, token = null) => {
  if (!token) throw createError('401');

  const { sub: userId, integrations } = tokenUtil.decode(token);
  // TODO the user should be retrieved via the service
  const user = await userRepo.findUserById(userId);

  return {
    credentials: pick(user, 'id', 'username'),
    artifacts: { integrations },
  };
};

export default () => {
  return {
    authenticate: async (request, reply) => {
      let artifacts = { requestId: request.id };

      try {
        const { networkId } = request.params;
        const token = request.raw.req.headers['x-api-token'];
        const authenticationResult = await authenticate(networkId, token);

        artifacts = { ...artifacts, ...authenticationResult.artifacts };
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
  };
};
