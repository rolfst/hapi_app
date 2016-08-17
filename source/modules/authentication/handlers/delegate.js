import Boom from 'boom';
import token from 'common/utils/token';
import { findOrCreateUserDevice } from 'common/repositories/authentication';
import createAccessToken from 'modules/authentication/services/create-access-token';
import findIntegrationTokens from 'modules/authentication/services/find-integration-tokens';

export default async (req, reply) => {
  try {
    const decodedToken = token.decode(req.query.refresh_token);
    if (!decodedToken.sub) throw Boom.badData('No sub found in refresh token.');

    const userId = decodedToken.sub;
    const authenticatedIntegrations = await findIntegrationTokens(userId);

    const deviceName = req.headers['user-agent'];
    const device = await findOrCreateUserDevice(userId, deviceName);
    const refreshedAccessToken = createAccessToken(
      userId,
      device.device_id,
      authenticatedIntegrations
    );

    return reply({ success: true, data: { access_token: refreshedAccessToken } });
  } catch (err) {
    console.log('Error when delegating', err);
    return reply(err);
  }
};
