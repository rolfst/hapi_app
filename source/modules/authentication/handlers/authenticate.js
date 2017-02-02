import { pick, omit } from 'lodash';
import * as authenticationService from '../services/authentication';
import * as Logger from '../../../shared/services/logger';

const logger = Logger.createLogger('AUTHENTICATION/handler/authenticate');

/*
 * The authentication script first authenticates with the Flex-Appeal database
 * before going further. When the user is authenticated with the Flex-Appeal database
 * we try to authenticate the user with each integration of the network the user
 * belongs to. When the user is authenticated with an integration, we will
 * set the user_tokens retrieved from the integration.
 */
export default async (request, reply) => {
  try {
    const message = { ...request.pre, ...request.auth };
    const payload = pick(request.payload, 'username', 'password');

    message.deviceName = request.headers['user-agent'];
    logger.info('Authenticating', { ...omit(payload, 'password'), message });
    const result = await authenticationService.authenticate(payload, message);
    const data = {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      last_login: result.user.lastLogin,
    };

    return reply({ data });
  } catch (err) {
    return reply(err);
  }
};
