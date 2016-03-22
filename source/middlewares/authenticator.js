import Boom from 'boom';
import auth from 'services/auth';
import { User } from 'models';

export default () => {
  return {
    authenticate: (request, reply) => {
      const req = request.raw.req;
      const token = req.headers['x-api-token'];

      if (!token) {
        return reply(Boom.unauthorized('No token specified.'));
      }

      try {
        const decodedToken = auth.decodeToken(token);

        return User.findById(decodedToken.sub).then(user => {
          reply.continue({ credentials: { user } });
        });
      } catch (e) {
        return reply(Boom.forbidden(e.message));
      }
    },
  };
};
