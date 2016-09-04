import moment from 'moment';
import Boom from 'boom';
import NotInAnyNetwork from 'common/errors/not-in-any-network';
import tokenUtil from 'common/utils/token';
import userBelongsToNetwork from 'common/utils/user-belongs-to-network';
import * as userRepo from 'common/repositories/user';
import analytics from 'common/services/analytics';
import firstLoginEvent from 'common/events/first-login-event';
import * as authenticationRepo from 'common/repositories/authentication';
import createAccessToken from 'modules/authentication/utils/create-access-token';
import createRefreshToken from 'modules/authentication/utils/create-refresh-token';
import * as impl from 'modules/authentication/services/authentication/implementation';

// TODO: This should be moved to a Integration service
const authenticateWithIntegrations = async (user, credentials) => {
  const authenticationPromises = impl.makeAuthenticationPromises(user.Networks, credentials);
  const authSettings = await impl.authenticateIntegrations(user, authenticationPromises);

  if (authSettings.length > 0) {
    await impl.setIntegrationTokens(user, authSettings);
  }

  return authSettings;
};

export const delegate = async (payload, { request }) => {
  const decodedToken = tokenUtil.decode(request.query.refresh_token);
  if (!decodedToken.sub) throw Boom.badData('No sub found in refresh token.');

  const userId = decodedToken.sub;
  const user = await userRepo.findUserById(userId);

  const authenticatedIntegrations = authenticateWithIntegrations(user, payload);

  const deviceName = request.headers['user-agent'];
  const device = await authenticationRepo.findOrCreateUserDevice(userId, deviceName);
  const refreshedAccessToken = createAccessToken(
    userId, device.device_id, authenticatedIntegrations
  );

  return { refreshedAccessToken };
};

export const authenticate = async (payload, { request }) => {
  const user = await impl.authenticateUser(payload);

  const authenticatedIntegrations = await authenticateWithIntegrations(user, payload);

  if (!userBelongsToNetwork(user)) throw NotInAnyNetwork;

  const deviceName = request.headers['user-agent'];

  const device = await authenticationRepo.findOrCreateUserDevice(user.id, deviceName);
  userRepo.updateUser(user.id, { lastLogin: moment().toISOString() });

  const accessToken = createAccessToken(user.id, device.device_id, authenticatedIntegrations);
  const refreshToken = createRefreshToken(user.id, device.device_id);

  analytics.registerProfile(user);
  analytics.setUser(user);

  if (user.lastLogin === null) analytics.track(firstLoginEvent());

  return { accessToken, refreshToken, user };
};
