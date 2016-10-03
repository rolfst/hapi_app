import { find } from 'lodash';
import moment from 'moment';
import Promise from 'bluebird';
import userBelongsToNetwork from '../../../../shared/utils/user-belongs-to-network';
import createError from '../../../../shared/utils/create-error';
import * as authenticationRepo from '../../../../shared/repositories/authentication';
import * as userRepo from '../../../../shared/repositories/user';
import * as networkUtil from '../../../../shared/utils/network';
import createAccessToken from '../../utils/create-access-token';
import createRefreshToken from '../../utils/create-refresh-token';
import checkPassword from '../../utils/check-password';

export const updateLastLogin = async (user) => {
  userRepo.updateUser(user.id, { lastLogin: moment().toISOString() });
};

export const getIntegrationTokensForUser = (user) => {
  const result = user.Networks
    .filter(network => network.NetworkUser.userToken !== null)
    .map(network => ({
      name: network.Integrations[0].name,
      token: network.NetworkUser.userToken,
      externalId: network.NetworkUser.externalId,
    }));

  return result;
};

export const authenticateUser = async ({ username, password }) => {
  const user = await userRepo.findUserByUsername(username);
  if (!user) throw createError('10004');

  const validPassword = checkPassword(user.password, password);
  if (!validPassword) throw createError('10004');

  return user;
};

export const createAuthenticationTokens = async (userId, deviceName, authenticatedIntegrations) => {
  const device = await authenticationRepo.findOrCreateUserDevice(userId, deviceName);
  const accessToken = createAccessToken(
    userId, device.device_id, authenticatedIntegrations);
  const refreshToken = await createRefreshToken(userId, device.device_id);

  return { accessToken, refreshToken };
};

export const mapNetworkAndToken = (network, authenticatedIntegrations) => ({
  network,
  token: find(authenticatedIntegrations, { name: network.Integrations[0].name }).token,
});

export const setIntegrationTokens = (user, authenticatedIntegrations) => {
  const setIntegrationTokenPromises = user.Networks
    .filter(networkUtil.hasIntegration)
    .map(network => mapNetworkAndToken(network, authenticatedIntegrations))
    .map(({ network, token }) => userRepo.setIntegrationToken(user, network, token));

  return Promise.all(setIntegrationTokenPromises);
};

export const getAuthenticationTokens = async (user, deviceName) => {
  if (!userBelongsToNetwork(user)) {
    throw createError('403', 'The user does not belong to any network.');
  }

  const { accessToken, refreshToken } = await createAuthenticationTokens(
    user.id, deviceName, getIntegrationTokensForUser(user));

  updateLastLogin(user);

  return { accessToken, refreshToken };
};
