import { find } from 'lodash';
import Promise from 'bluebird';
import createAdapter from 'common/utils/create-adapter';
import WrongCredentials from 'common/errors/wrong-credentials';
import * as userRepo from 'common/repositories/user';
import * as networkUtil from 'common/utils/network';
import checkPassword from 'modules/authentication/utils/check-password';

export const authenticateUser = async ({ username, password }) => {
  const user = await userRepo.findUserByUsername(username);
  const validPassword = checkPassword(user.password, password);

  if (!validPassword) throw WrongCredentials;

  return user;
};

export const makeAuthenticationPromises = (networks, credentials) => {
  return networks
    .filter(networkUtil.hasIntegration)
    .map(network => ({ network, adapter: createAdapter(network, [], {
      proceedWithoutToken: true,
    }) }))
    .map(({ network, adapter }) => adapter.authenticate(network.externalId, credentials))
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
