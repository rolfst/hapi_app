import { find } from 'lodash';
import { setIntegrationToken } from 'common/repositories/user';
import networkHasIntegration from 'common/utils/network-has-integration';

export const mapNetworkAndToken = (network, authenticatedIntegrations) => ({
  network,
  token: find(authenticatedIntegrations, { name: network.Integrations[0].name }).token,
});

const setIntegrationTokens = (user, authenticatedIntegrations) => {
  const setIntegrationTokenPromises = user.Networks
    .filter(networkHasIntegration)
    .map(network => mapNetworkAndToken(network, authenticatedIntegrations))
    .map(({ network, token }) => setIntegrationToken(user, network, token));

  return Promise.all(setIntegrationTokenPromises);
};

export default setIntegrationTokens;
