import IntegrationNotFound from 'common/errors/integration-not-found';
import pmtAdapter from 'integrations/pmt/adapter';

const getAdapterForServiceName = name => {
  const drivers = {
    'pmt': pmtAdapter,
  };

  return drivers[name];
};

const getCredentials = name => {
  const map = {
    'pmt': { 'api-key': 'flexappeal4rwrs '},
  };

  return map[name];
}

export default (serviceName) => {
  const adapter = getAdapterForServiceName(serviceName);
  const credentials = getCredentials(serviceName);

  if (!adapter) throw new IntegrationNotFound(serviceName);

  return adapter(credentials);
}
