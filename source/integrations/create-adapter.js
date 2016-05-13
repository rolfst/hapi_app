import IntegrationNotFound from 'common/errors/integration-not-found';
import pmtAdapter from 'integrations/pmt/adapter';

const getAdapterForService = name => {
  const drivers = {
    1: pmtAdapter,
  };

  return drivers[name];
};

export default (serviceName) => {
  const adapter = getAdapterForService(serviceName);

  if (!adapter) throw new IntegrationNotFound(serviceName);

  return adapter;
};
