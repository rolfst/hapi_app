import moment from 'moment';
import authenticateNetworkIntegrations from 'common/utils/authenticate-network-integrations';
import checkPassword from 'common/utils/check-password';
import userBelongsToNetwork from 'common/utils/user-belongs-to-network';
import { findUserByUsername, updateUser } from 'common/repositories/user';
import { findOrCreateUserDevice } from 'common/repositories/authentication';
import createAccessToken from 'common/utils/create-access-token';
import createRefreshToken from 'common/utils/create-refresh-token';
import WrongCredentials from 'common/errors/wrong-credentials';
import NotInAnyNetwork from 'common/errors/not-in-any-network';

export default async (req, reply) => {
  const { username, password } = req.payload;
  let authenticatedIntegrations = [];

  try {
    const credentials = { username, password };
    const user = await findUserByUsername(credentials.username);

    if (!user) throw WrongCredentials;

    authenticatedIntegrations = await authenticateNetworkIntegrations(user.Networks, credentials);

    if (authenticatedIntegrations.length === 0) {
      if (!checkPassword(user.password, credentials.password)) throw WrongCredentials;
    }

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

    // TODO: Send analytics to Mixpanel

    return reply({ data });
  } catch (err) {
    return reply(err);
  }
};
