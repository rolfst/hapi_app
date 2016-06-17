import _ from 'lodash';
import createAdapter from 'adapters/create-adapter';
import { findNetworkById } from 'common/repositories/network';
import hasIntegration from 'common/utils/network-has-integration';

const networksWithIntegrations = (networks) => {
  const promises = networks
    .filter(network => hasIntegration(network))
    .map(network => findNetworkById(network.id));

  return Promise.all(promises);
};

const authenticateWithIntegration = async (network, credentials) => {
  try {
    const adapter = createAdapter(network);
    const { name, token } = await adapter.authenticate(network.externalId, credentials);

    return { name, token };
  } catch (err) { return null; }
};

export default async (networks, credentials) => {
  const networksToAuthenticate = await networksWithIntegrations(networks);

  const mapFn = _.partialRight(authenticateWithIntegration, credentials);
  const promises = networksToAuthenticate.map(mapFn);

  const authenticatedNetworkData = await Promise.all(promises);

  return authenticatedNetworkData.filter(data => data !== null);
};
