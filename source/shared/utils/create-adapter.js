import { find } from 'lodash';
import createError from './create-error';
import pmtAdapter from 'adapters/pmt/adapter';

const availableIntegrations = [{
  name: 'PMT',
  adapter: pmtAdapter,
}];

export default (network, authSettings = [], options = {}) => {
  let { integrations, proceedWithoutToken } = options;
  proceedWithoutToken = proceedWithoutToken || false;
  integrations = integrations || availableIntegrations;

  const integration = find(integrations, { name: network.Integrations[0].name });
  if (!integration) throw createError('10001');

  let token = null;
  const authSetting = find(authSettings, { name: integration.name });

  if (!authSetting && !proceedWithoutToken) {
    throw createError('403');
  }

  token = authSetting ? authSetting.token : null;

  return integration.adapter(network, token);
};
