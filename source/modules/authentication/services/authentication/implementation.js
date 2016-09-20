import { find } from 'lodash';
import moment from 'moment';
import Promise from 'bluebird';
import createAdapter from 'common/utils/create-adapter';
import createError from 'common/utils/create-error';
import * as userRepo from 'common/repositories/user';
import * as networkUtil from 'common/utils/network';
import checkPassword from 'modules/authentication/utils/check-password';

export const authenticateUser = async ({ username, password }) => {
  const user = await userRepo.findUserByUsername(username);
  if (!user) throw createError('10004');

  const validPassword = checkPassword(user.password, password);
  if (!validPassword) throw createError('10004');

  return user;
};

export const makeAuthenticationPromises = (networks, credentials) => {
  return networks
    .filter(networkUtil.hasIntegration)
    .map(network => createAdapter(network, [], { proceedWithoutToken: true }))
    .map(adapter => adapter.authenticate(credentials))
    .map(promise => Promise.resolve(promise));
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

export const authenticateIntegrations = async (user, authenticationPromises) => {
  const authenticatedIntegrations = await Promise
    .all(authenticationPromises.map(p => p.reflect()))
    .filter(inspection => inspection.isFulfilled())
    .map(inspection => inspection.value());

  return authenticatedIntegrations;
};

export const updateLastLogin = async (user) => {
  userRepo.updateUser(user.id, { lastLogin: moment().toISOString() });
};
