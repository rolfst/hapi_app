import createError from '../../../../shared/utils/create-error';
import tokenUtil from '../../../../shared/utils/token';
import * as userRepo from '../../../core/repositories/user';
import * as Analytics from '../../../../shared/services/analytics';
import firstLoginEvent from '../../../../shared/events/first-login-event';
import * as impl from './implementation';

export const delegate = async (payload, message) => {
  let decodedToken;

  try {
    decodedToken = tokenUtil.decode(payload.refreshToken);
  } catch (err) {
    throw createError('403', 'Wrong refresh token specified.');
  }

  if (!decodedToken.sub) throw createError('403', 'No sub found in refresh token.');

  const user = await userRepo.findUserById(decodedToken.sub);
  const integrationInfo = await impl.getIntegrationInfoForUser(user.id);
  const { accessToken } = await impl.createAuthenticationTokens(
    user.id, message.deviceName, integrationInfo);

  return { accessToken };
};

export const authenticate = async (payload, message) => {
  const user = await impl.authenticateUser(payload);

  await impl.assertUserBelongsToANetwork(user.id);

  const tokens = await impl.getAuthenticationTokens(user, message.deviceName);

  Analytics.registerProfile(user);

  if (user.lastLogin === null) Analytics.track(firstLoginEvent(), user.id);

  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user };
};
