import Boom from 'boom';
import createAdapter from 'common/utils/create-adapter';
import { setIntegrationToken } from 'common/repositories/user';
import { findOrCreateUserDevice } from 'common/repositories/authentication';
import createAccessToken from 'modules/authentication/services/create-access-token';

export default async (req, reply) => {
  try {
    const user = req.auth.credentials;
    const authenticatedIntegrations = req.auth.artifacts.integrations;
    const adapter = createAdapter(req.pre.network);
    const authResult = await adapter.authenticate();

    const deviceName = req.headers['user-agent'];
    const device = await findOrCreateUserDevice(user.id, deviceName);
    const newAccessToken = createAccessToken(user.id, device.device_id, [
      ...authenticatedIntegrations,
      authResult,
    ]);

    await setIntegrationToken(user, req.pre.network, authResult.token);

    return reply({ data: { access_token: newAccessToken } });
  } catch (err) {
    return reply(Boom.unauthorized('Could not authenticate with integration'));
  }
};
