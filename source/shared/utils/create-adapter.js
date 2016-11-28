import { find } from 'lodash';
import createError from './create-error';

// TODO this should be moved to pmt adapter
import pmtAdapter from '../../adapters/pmt/adapter';

const availableIntegrations = [{
  name: 'PMT',
  adapter: pmtAdapter,
}];

export const createAdapterFactory = (integrationName, authSettings = [], options = {}) => {
  let { integrations, proceedWithoutToken } = options;
  proceedWithoutToken = proceedWithoutToken || false;
  integrations = integrations || availableIntegrations;

  let token = null;
  const authSetting = find(authSettings, { name: integrationName });

  if (!authSetting && !proceedWithoutToken) {
    throw createError('403');
  }

  token = authSetting ? authSetting.token : null;

  return {
    create: (network) => {
      if (!network.integrations.includes(integrationName)) throw createError('10001');

      const integration = find(integrations, { name: network.integrations[0] });

      return integration.adapter(network, token);
    },
  };
};

export const createAdapter = (network, authSettings = [], options = {}) => {
  const adapterFactory = createAdapterFactory(network.integrations[0], authSettings, options);

  return adapterFactory.create(network);
};
