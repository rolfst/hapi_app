import moment from 'moment';
import { updateUser } from 'common/repositories/user';
import { findOrCreateUserDevice } from 'common/repositories/authentication';
import userBelongsToNetwork from 'common/utils/user-belongs-to-network';
import analytics from 'common/services/analytics';
import firstLoginEvent from 'common/events/first-login-event';
import NotInAnyNetwork from 'common/errors/not-in-any-network';
import createRefreshToken from 'modules/authentication/services/create-refresh-token';
import createAccessToken from 'modules/authentication/services/create-access-token';
import authenticateUser from 'modules/authentication/services/authenticate-user';
import authenticateIntegrations from 'modules/authentication/services/authenticate-integrations';
import setIntegrationTokens from 'modules/authentication/services/set-integration-tokens';

/*
 * The authentication script first authenticates with the Flex-Appeal database
 * before going further. When the user is authenticated with the Flex-Appeal database
 * we try to authenticate the user with each integration of the network the user
 * belongs to. When the user is authenticated with an integration, we will
 * set the user_tokens retrieved from the integration. We also append the integrations
 * to the payload of the access token, so we can validate the user for requests that
 * are especially designed for networks that have an integration enabled.
 */
export default async (req, reply) => {
  const { username, password } = req.payload;

  try {
    const credentials = { username, password };
    const user = await authenticateUser(credentials);

    const authenticatedIntegrations = await authenticateIntegrations(user.Networks, credentials);

    if (authenticatedIntegrations.length > 0) {
      await setIntegrationTokens(user, authenticatedIntegrations);
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

    analytics.registerProfile(user);
    analytics.setUser(user);
    if (user.lastLogin === null) analytics.track(firstLoginEvent());

    return reply({ data });
  } catch (err) {
    console.log('Error when authenticating user', err);
    return reply(err);
  }
};
