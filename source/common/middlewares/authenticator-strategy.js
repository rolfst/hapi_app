import analytics from '../services/analytics';
import tokenUtil from '../utils/token';
import createError from '../utils/create-error';
import * as networkUtil from '../utils/network';
import * as userRepo from '../repositories/user';

export const authenticate = async (networkId, token = null) => {
  if (!token) throw createError('401');

  const { sub: userId, integrations } = tokenUtil.decode(token);
  const user = await userRepo.findUserById(userId);

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

        if (err.is_error) return reply(err).code(err.status_code);

        return reply(createError('401')).code(401);
      }
    },
  };
};
