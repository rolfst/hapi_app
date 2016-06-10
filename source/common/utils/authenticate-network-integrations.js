import createAdapter from 'adapters/create-adapter';
import { findNetworkById } from 'common/repositories/network';
import hasIntegration from 'common/utils/network-has-integration';

const networksWithIntegrations = (networks) => {
  const promises = networks.map(network => findNetworkById(network.id));

  return Promise.all(promises);
};

export default async (networks, credentials) => {
  const validNetworks = await networksWithIntegrations(networks);

  const promises = validNetworks
    .filter(network => hasIntegration(network))
    .map(network => {
      return createAdapter(network).authenticate(network.externalId, credentials)
        .then(({ name, token }) => ({ name, token }))
        .catch(() => null);
    });

  const authenticatedNetworkData = await Promise.all(promises);

  return authenticatedNetworkData.filter(data => data !== null);
};
