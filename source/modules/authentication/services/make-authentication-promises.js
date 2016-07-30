import Promise from 'bluebird';
import createAdapter from 'adapters/create-adapter';
import networkHasIntegration from 'common/utils/network-has-integration';

const makeAuthenticationPromises = (networks, credentials) => {
  return networks
    .filter(networkHasIntegration)
    .map(network => ({ network, adapter: createAdapter(network) }))
    .map(({ network, adapter }) => adapter.authenticate(network.externalId, credentials))
    .map(promise => Promise.resolve(promise));
};

export default makeAuthenticationPromises;
