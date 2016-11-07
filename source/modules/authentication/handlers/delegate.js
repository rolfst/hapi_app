import * as Logger from '../../../shared/services/logger';
import * as authenticationService from '../services/authentication';

const logger = Logger.getLogger('AUTHENCTIATION/handler/delegate');

export default async (request, reply) => {
  try {
    const payload = { refreshToken: request.query.refresh_token };
    const message = { ...request.pre, ...request.auth };
    message.deviceName = request.headers['user-agent'];

    logger.info('Delegate', { payload, message });
    const result = await authenticationService.delegate(payload, message);

    return reply({ success: true, data: { access_token: result.accessToken } });
  } catch (err) {
    return reply(err);
  }
};
