import createError from '../utils/create-error';
import { Integration } from '../models';
import * as Logger from '../../shared/services/logger';

const logger = Logger.getLogger('SHARED/middleware/integrationStrategy');

export default () => {
  return {
    authenticate: async(request, reply) => {
      try {
        const req = request.raw.req;
        const token = req.headers['x-api-token'];

        if (!token) throw createError('401');

        // TODO uses Integration data representation instead of domain object
        const integration = await Integration.findOne({ where: { token } });
        if (!integration) throw createError('422', 'No integration found for the specified token.');

        return reply.continue({ credentials: integration });
      } catch (err) {
        logger.warn('Error in integration strategy', { err });
        return reply(err).code(err.status_code);
      }
    },
  };
};
