import createError from '../../../../shared/utils/create-error';
import tokenUtil from '../../../../shared/utils/token';
import userBelongsToNetwork from '../../../../shared/utils/user-belongs-to-network';
import * as userRepo from '../../../../shared/repositories/user';
import analytics from '../../../../shared/services/analytics';
import firstLoginEvent from '../../../../shared/events/first-login-event';
import * as integrationUtil from '../../utils/integration-tokens-for-user';
import * as impl from './implementation';

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

  const { accessToken, refreshToken } = await impl.createAuthenticationTokens(
    user.id, message.deviceName, authenticatedIntegrations);

  impl.updateLastLogin(user);

  return { accessToken, refreshToken };
};

export const delegate = async (payload, message) => {
  const decodedToken = tokenUtil.decode(payload.refreshToken);
  if (!decodedToken.sub) throw createError('403', 'No sub found in refresh token.');

  const user = await userRepo.findUserById(decodedToken.sub);
  const authenticatedIntegrations = integrationUtil.getIntegrationTokensForUser(user);

  const { accessToken } = await impl.createAuthenticationTokens(
    user.id, message.deviceName, authenticatedIntegrations);

  return { accessToken };
};

export const authenticate = async (payload, message) => {
  const user = await impl.authenticateUser(payload);
  const { accessToken, refreshToken } = await getAuthenticationTokens(payload, message);

  analytics.registerProfile(user);
  analytics.setUser(user);

  if (user.lastLogin === null) analytics.track(firstLoginEvent());

  return { accessToken, refreshToken, user };
};
