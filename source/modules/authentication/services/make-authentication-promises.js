import Promise from 'bluebird';
import createAdapter from 'common/utils/create-adapter';
import networkHasIntegration from 'common/utils/network-has-integration';

const makeAuthenticationPromises = (networks, credentials) => {
  return networks
    .filter(networkHasIntegration)
    .map(network => ({ network, adapter: createAdapter(network, [], {
      proceedWithoutToken: true,
    }) }))
    .map(({ network, adapter }) => adapter.authenticate(network.externalId, credentials))
    .map(promise => Promise.resolve(promise));
};

export default makeAuthenticationPromises;
