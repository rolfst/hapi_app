import Boom from 'boom';
import { Integration } from 'common/models';

export default () => {
  return {
    authenticate: async (request, reply) => {
      const req = request.raw.req;
      const token = req.headers['x-api-token'];

      if (!token) throw new Error('No token specified.');

      try {
        const integration = await Integration.findOne({
          where: { token },
        });

        if (!integration) throw new Error('Invalid token.');

        return reply.continue({ credentials: integration });
      } catch (e) {
        return reply(Boom.unauthorized(e.message));
      }
    },
  };
};
