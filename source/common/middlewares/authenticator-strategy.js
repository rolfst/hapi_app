import Boom from 'boom';
import tokenUtil from 'common/utils/token';
import { findUserById } from 'common/repositories/user';

export default () => {
  return {
    authenticate: async (request, reply) => {
      const req = request.raw.req;
      const token = req.headers['x-api-token'];

      if (!token) {
        return reply(Boom.unauthorized('No token specified.'));
      }

      try {
        const decodedToken = tokenUtil.decode(token);
        const user = await findUserById(decodedToken.sub);

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
