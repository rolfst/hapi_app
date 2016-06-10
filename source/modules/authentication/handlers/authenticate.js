import moment from 'moment';
import checkPassword from 'common/utils/check-password';
import userBelongsToNetwork from 'common/utils/user-belongs-to-network';
import { findUserByUsername } from 'common/repositories/user';
import { findOrCreateUserDevice } from 'common/repositories/authentication';
import createAccessToken from 'common/utils/create-access-token';
import createRefreshToken from 'common/utils/create-refresh-token';
import WrongCredentials from 'common/errors/wrong-credentials';
import NotInAnyNetwork from 'common/errors/not-in-any-network';

export default async (req, reply) => {
  const { payload } = req;

  try {
    const user = await findUserByUsername(payload.username);

    if (!user || !checkPassword(user.password, payload.password)) throw WrongCredentials;
    if (!userBelongsToNetwork(user)) throw NotInAnyNetwork;

    const deviceName = req.headers['user-agent'];

    const device = await findOrCreateUserDevice(user.id, deviceName);

    const accessToken = createAccessToken(user.id, device.device_id);
    const refreshToken = createRefreshToken(user.id, device.device_id);

    await user.update({ lastLogin: moment().toISOString() });

    const updatedUser = await user.reload();

    const data = {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: updatedUser.toJSON(),
    };

    return reply({ data });
  } catch (err) {
    return reply(err);
  };
  //
  //
  // return findUserByUsername(payload.username).then(user => {
  //   if (!user || !checkPassword(user.password, payload.password)) throw WrongCredentials;
  //   if (!userBelongsToNetwork(user)) throw NotInAnyNetwork;
  //
  //   const deviceName = req.headers['user-agent'];
  //
  //   return findOrCreateUserDevice(user.id, deviceName).then(device => {
  //     const accessToken = createAccessToken(user.id, device.device_id);
  //     const refreshToken = createRefreshToken(user.id, device.device_id);
  //
  //     return user.update({ lastLogin: moment().toISOString() }).then(() => user.reload())
  //       .then(updatedUser => );
  //   });
  // }).catch(err => reply(err));
  // 4. Create deviceId based on user agent
  // 5. Check if deviceId already exists or create new one
  // 6. Generate JWT token
  // 7. Generated refresh token
  // 8. Send data to Mixpanel
  // 9. Update last_login for user
  // 10. Return response
};
