import Boom from 'boom';
import analytics from 'common/services/analytics';
import tokenUtil from 'common/utils/token';
import * as networkUtil from 'common/utils/network';
import { findUserById } from 'common/repositories/user';

export const authenticate = async (networkId, token = null) => {
  if (!token) throw new Error('No token specified.');

  const { sub: userId, integrations } = tokenUtil.decode(token);
  const user = await findUserById(userId);

  analytics.setUser(user);

  return {
    credentials: networkId ? networkUtil.addUserScope(user, networkId) : user,
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
        console.error('Error in Authenticator Strategy', err);
        return reply(Boom.unauthorized(err.message));
      }
    },
  };
};
