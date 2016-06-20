import Boom from 'boom';
import tokenUtil from 'common/utils/token';
import { findUserById } from 'common/repositories/user';

export default () => {
  return {
    authenticate: async (request, reply) => {
      const params = request.params;
      const req = request.raw.req;
      const token = req.headers['x-api-token'];

      if (!token) {
        return reply(Boom.unauthorized('No token specified.'));
      }

      try {
        const decodedToken = tokenUtil.decode(token);
        const user = await findUserById(decodedToken.sub);

        if (params.networkId) {
          const network = user.getNetwork(params.networkId);
          user.set('scope', network.NetworkUser.roleType);
        }

        return reply.continue({
          credentials: user,
          artifacts: { integrations: decodedToken.integrations },
        });
      } catch (err) {
        console.log('Error in Authenticator Strategy: ', err);
        return reply(Boom.unauthorized(err.message));
      }
    },
  };
};
