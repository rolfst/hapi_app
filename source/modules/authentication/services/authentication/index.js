import createError from 'common/utils/create-error';
import tokenUtil from 'common/utils/token';
import userBelongsToNetwork from 'common/utils/user-belongs-to-network';
import * as userRepo from 'common/repositories/user';
import analytics from 'common/services/analytics';
import firstLoginEvent from 'common/events/first-login-event';
import * as authenticationRepo from 'common/repositories/authentication';
import createAccessToken from 'modules/authentication/utils/create-access-token';
import createRefreshToken from 'modules/authentication/utils/create-refresh-token';
import * as impl from 'modules/authentication/services/authentication/implementation';
import * as integrationUtil from 'modules/authentication/utils/integration-tokens-for-user';

// TODO: This should be moved to a Integration service
const authenticateWithIntegrations = async (user, credentials) => {
  const authenticationPromises = impl.makeAuthenticationPromises(user.Networks, credentials);
  const authSettings = await impl.authenticateIntegrations(user, authenticationPromises);

  if (authSettings.length > 0) {
    await impl.setIntegrationTokens(user, authSettings);
  }

  return authSettings;
};

export const getAuthenticationTokens = async (payload, message) => {
  const user = await impl.authenticateUser(payload);
  const authenticatedIntegrations = await authenticateWithIntegrations(user, payload);

  if (payload.integrationSettings) {
    authenticatedIntegrations.concat([payload.integrationSettings]);
  }

  if (!userBelongsToNetwork(user)) throw createError('403');

  const device = await authenticationRepo.findOrCreateUserDevice(user.id, message.deviceName);
  const accessToken = await createAccessToken(user.id, device.device_id, authenticatedIntegrations);
  const refreshToken = await createRefreshToken(user.id, device.device_id);

  impl.updateLastLogin(user);

  return { accessToken, refreshToken };
};

export const delegate = async (payload, { request }) => {
  const decodedToken = tokenUtil.decode(payload.refreshToken);
  if (!decodedToken.sub) throw createError('422', 'No sub found in refresh token.');

  const userId = decodedToken.sub;
  const user = await userRepo.findUserById(userId);
  const authenticatedIntegrations = integrationUtil.getIntegrationTokensForUser(user);

  const deviceName = request.headers['user-agent'];
  const device = await authenticationRepo.findOrCreateUserDevice(userId, deviceName);
  const refreshedAccessToken = createAccessToken(
    userId, device.device_id, authenticatedIntegrations
  );

  return { refreshedAccessToken };
};

export const authenticate = async (payload, message) => {
  const { accessToken, refreshToken } = await getAuthenticationTokens(payload, message);
  const user = await impl.authenticateUser(payload);

  analytics.registerProfile(user);
  analytics.setUser(user);

  if (user.lastLogin === null) analytics.track(firstLoginEvent());

  return { accessToken, refreshToken, user };
};
