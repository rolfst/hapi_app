const R = require('ramda');
const integrationService = require('../services/integration');
const Logger = require('../../../shared/services/logger');

const logger = Logger.createLogger('INTEGRATIONS/handler/integrationAuth');

module.exports = async (req, reply) => {
  try {
    const payload = R.merge(req.params, req.payload);
    const message = R.merge(req.pre, req.auth, { deviceName: req.headers['user-agent'] });

    logger.info('Authenticating with integration', { payload: R.omit(['password'], payload),
      message });
    const accessToken = await integrationService.authenticate(payload, message);

    return reply({ data: { access_token: accessToken } });
  } catch (err) {
    return reply(err);
  }
};
