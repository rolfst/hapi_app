import Boom from 'boom';
import log from 'common/services/logger';
import analytics from 'common/services/analytics';
import tokenUtil from 'common/utils/token';
import addNetworkScope from 'common/utils/add-network-scope';
import { findUserById } from 'common/repositories/user';

export const authenticate = async (networkId, token = null) => {
  if (!token) throw new Error('No token specified.');

  const { sub: userId, integrations } = tokenUtil.decode(token);
  const user = await findUserById(userId);

  analytics.setUser(user);

  return {
    credentials: networkId ? addNetworkScope(user, networkId) : user,
    artifacts: { integrations },
  };
};

export default () => {
  return {
    authenticate: async (request, reply) => {
      const { networkId } = request.params;
      const token = request.raw.req.headers['x-api-token'];

      try {
        const result = await authenticate(networkId, token);

        return reply.continue(result);
      } catch (err) {
        log.error('Error in Authenticator Strategy: ', { stack: err.stack });
        return reply(Boom.unauthorized(err.message));
      }
    },
  };
};
