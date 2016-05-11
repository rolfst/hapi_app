import Boom from 'boom';
import Integration from 'common/models/integration';

export default () => {
  return {
    authenticate: (request, reply) => {
      const req = request.raw.req;
      const token = req.headers['x-api-token'];

      if (!token) {
        return reply(Boom.unauthorized('No token specified.'));
      }

      try {
        return Integration.findOne({
          where: { token },
        }).then(integration => {
          if (!integration) throw Error('Invalid token.');

          return reply.continue({ credentials: { integration } });
        });
      } catch (e) {
        return reply(Boom.forbidden(e.message));
      }
    },
  };
};
