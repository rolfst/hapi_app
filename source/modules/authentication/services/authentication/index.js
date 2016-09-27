import createError from '../../../../shared/utils/create-error';
import tokenUtil from '../../../../shared/utils/token';
import * as userRepo from '../../../../shared/repositories/user';
import analytics from '../../../../shared/services/analytics';
import firstLoginEvent from '../../../../shared/events/first-login-event';
import * as integrationUtil from '../../utils/integration-tokens-for-user';
import * as impl from './implementation';

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
  const tokens = await impl.getAuthenticationTokens(user, message.deviceName);

  analytics.registerProfile(user);
  analytics.setUser(user);

  if (user.lastLogin === null) analytics.track(firstLoginEvent());

  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user };
};
