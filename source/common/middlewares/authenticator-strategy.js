import Boom from 'boom';
import jwt from 'jwt-simple';
import { User } from 'common/models';

export default () => {
  return {
    authenticate: (request, reply) => {
      const params = request.params;
      const req = request.raw.req;
      const token = req.headers['x-api-token'];

      if (!token) {
        return reply(Boom.unauthorized('No token specified.'));
      }

      try {
        const decodedToken = jwt.decode(token, process.env.JWT_SECRET);

        return User.findById(decodedToken.sub).then(user => {
          const network = user.getNetwork(params.networkId);

          user.set('scope', network.NetworkUser.roleType);

          reply.continue({ credentials: user });
        });
      } catch (e) {
        return reply(Boom.unauthorized(e.message));
      }
    },
  };
};
