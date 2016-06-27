import moment from 'moment';
import { getIntegrationTokensForUser, updateUser } from 'common/repositories/user';
import { findOrCreateUserDevice } from 'common/repositories/authentication';
import userBelongsToNetwork from 'common/utils/user-belongs-to-network';
import createAccessToken from 'common/utils/create-access-token';
import createRefreshToken from 'common/utils/create-refresh-token';
import authenticateUser from 'common/utils/authenticate-user';
import analytics from 'common/services/analytics';
import firstLoginEvent from 'common/events/first-login-event';
import NotInAnyNetwork from 'common/errors/not-in-any-network';

export default async (req, reply) => {
  const { username, password } = req.payload;
  let authenticatedIntegrations = [];

  try {
    const credentials = { username, password };
    const user = await authenticateUser(credentials);

    authenticatedIntegrations = await getIntegrationTokensForUser(user);

    if (!userBelongsToNetwork(user)) throw NotInAnyNetwork;

    const deviceName = req.headers['user-agent'];

    const device = await findOrCreateUserDevice(user.id, deviceName);
    const updatedUser = await updateUser(user.id, { lastLogin: moment().toISOString() });

    const accessToken = createAccessToken(user.id, device.device_id, authenticatedIntegrations);
    const refreshToken = createRefreshToken(user.id, device.device_id);

    const data = {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: updatedUser.toJSON(),
    };

    analytics.registerProfile(user);
    analytics.setUser(user);
    if (user.lastLogin === null) analytics.track(firstLoginEvent());

    return reply({ data });
  } catch (err) {
    return reply(err);
  }
};
