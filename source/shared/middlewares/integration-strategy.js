const { pick } = require('lodash');
const { Integration } = require('../../modules/core/repositories/dao');
const createError = require('../utils/create-error');
const Logger = require('../services/logger');

const logger = Logger.createLogger('SHARED/middleware/integrationStrategy');

module.exports = () => {
  return {
    authenticate: async (request, reply) => {
      try {
        const req = request.raw.req;
        const token = req.headers['x-api-token'];

        if (!token) throw createError('401');

        // TODO uses Integration data representation instead of domain object
        const integration = await Integration.findOne({ where: { token } });
        if (!integration) throw createError('422', 'No integration found for the specified token.');

        return reply.continue({ credentials: pick(integration, 'id', 'name') });
      } catch (err) {
        logger.warn('Error in integration strategy', { err });
        return reply(err).code(err.status_code);
      }
    },
  };
};
