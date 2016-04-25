import Boom from 'boom';
import jwt from 'jwt-simple';
import User from 'common/models/user';

export default () => {
  return {
    authenticate: (request, reply) => {
      const req = request.raw.req;
      const token = req.headers['x-api-token'];

      if (!token) {
        return reply(Boom.unauthorized('No token specified.'));
      }

      try {
        const decodedToken = jwt.decode(token, process.env.JWT_SECRET);

        return User.findById(decodedToken.sub).then(user => {
          reply.continue({ credentials: { user } });
        });
      } catch (e) {
        return reply(Boom.forbidden(e.message));
      }
    },
  };
};
