import { pick } from 'lodash';
import analytics from '../services/analytics';
import tokenUtil from '../utils/token';
import * as serverUtil from '../utils/server';
import createError from '../utils/create-error';
import * as userRepo from '../../modules/core/repositories/user';

export const authenticate = async (networkId, token = null) => {
  if (!token) throw createError('401');

  const { sub: userId, integrations } = tokenUtil.decode(token);
  const user = await userRepo.findUserById(userId);

  analytics.setUser(user);

  return {
    credentials: pick(user, 'id', 'username'),
    artifacts: { integrations },
  };
};

export default () => {
  return {
    authenticate: async (request, reply) => {
      try {
        const { networkId } = request.params;
        const token = request.raw.req.headers['x-api-token'];
        const { credentials, artifacts } = await authenticate(networkId, token);
        artifacts.requestId = request.id;
        artifacts.authenticationToken = token;

        return reply.continue({ credentials, artifacts });
      } catch (err) {
        console.error('Error in Authenticator Strategy', err);

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
