import IntegrationNotFound from 'common/errors/integration-not-found';
import pmtAdapter from 'adapters/pmt/adapter';

const getAdapterForService = id => {
  const drivers = {
    1: pmtAdapter,
  };

  return drivers[id];
};

export default network => {
  const adapter = getAdapterForService(network.Integrations[0].id);

  if (!adapter) throw new IntegrationNotFound(network);

  return adapter;
};
