const { omit } = require('lodash');
const integrationService = require('../services/integration');
const Logger = require('../../../shared/services/logger');

const logger = Logger.createLogger('INTEGRATIONS/handler/integrationAuth');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth, deviceName: req.headers['user-agent'] };
    const payload = { ...req.payload, ...req.params };

    logger.info('Authenticating with integration', { payload: omit(payload, 'password'), message });
    const accessToken = await integrationService.authenticate(payload, message);

    return reply({ data: { access_token: accessToken } });
  } catch (err) {
    return reply(err);
  }
};
