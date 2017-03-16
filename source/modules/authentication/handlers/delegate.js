const R = require('ramda');
const Logger = require('../../../shared/services/logger');
const authenticationService = require('../services/authentication');

const logger = Logger.createLogger('AUTHENCTIATION/handler/delegate');

module.exports = async (request, reply) => {
  try {
    const payload = { refreshToken: request.query.refresh_token };
    const message = R.merge(request.pre, request.auth);
    message.deviceName = request.headers['user-agent'];

    logger.info('Delegate', { payload, message });
    const result = await authenticationService.delegate(payload, message);

    return reply({ success: true, data: { access_token: result.accessToken } });
  } catch (err) {
    return reply(err);
  }
};
