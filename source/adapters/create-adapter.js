import _ from 'lodash';
import IntegrationNotFound from 'common/errors/integration-not-found';
import pmtAdapter from 'adapters/pmt/adapter';

const getAdapterForService = (id, tokens) => {
  const getTokenForName = (name) => {
    return _.find(tokens, { name }).token;
  };

  const drivers = {
    1: pmtAdapter(getTokenForName('PMT')),
  };

  return drivers[id];
};

export default (network, tokens) => {
  const adapter = getAdapterForService(network.Integrations[0].id, tokens);

  if (!adapter) throw new IntegrationNotFound(network);

  return adapter;
};
