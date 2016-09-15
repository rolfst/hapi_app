import { find } from 'lodash';
import Boom from 'boom';
import IntegrationNotFound from 'common/errors/integration-not-found';
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
  if (!integration) throw new IntegrationNotFound();

  let token = null;
  const authSetting = find(authSettings, { name: integration.name });

  if (!authSetting && !proceedWithoutToken) {
    throw Boom.forbidden('The user has no authentication with the integration.');
  }

  token = authSetting ? authSetting.token : null;

  return integration.adapter(network, token);
};
