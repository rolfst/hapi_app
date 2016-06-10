import moment from 'moment';
import checkPassword from 'common/utils/check-password';
import userBelongsToNetwork from 'common/utils/user-belongs-to-network';
import { findUserByUsername, updateUser } from 'common/repositories/user';
import { findOrCreateUserDevice } from 'common/repositories/authentication';
import createAccessToken from 'common/utils/create-access-token';
import createRefreshToken from 'common/utils/create-refresh-token';
import WrongCredentials from 'common/errors/wrong-credentials';
import NotInAnyNetwork from 'common/errors/not-in-any-network';

export default async (req, reply) => {
  const { payload } = req;

  try {
    const user = await findUserByUsername(payload.username);

    if (!checkPassword(user.password, payload.password) || !user) throw WrongCredentials;
    if (!userBelongsToNetwork(user)) throw NotInAnyNetwork;

    const deviceName = req.headers['user-agent'];

    const device = await findOrCreateUserDevice(user.id, deviceName);
    const updatedUser = await updateUser(user.id, { lastLogin: moment().toISOString() });

    const accessToken = createAccessToken(user.id, device.device_id);
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
