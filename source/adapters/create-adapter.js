import _ from 'lodash';
import Boom from 'boom';
import IntegrationNotFound from 'common/errors/integration-not-found';
import pmtAdapter from 'adapters/pmt/adapter';

const availableIntegrations = ({
  1: {
    name: 'PMT',
    adapter: pmtAdapter,
  },
});

export default (network, authSettings = [], options = {}) => {
  let { integrations, proceedWithoutToken } = options;
  proceedWithoutToken = proceedWithoutToken || false;
  integrations = integrations || availableIntegrations;

  const integration = integrations[network.Integrations[0].id];
  if (!integration) throw IntegrationNotFound;

  let token = null;
  const authSetting = _.find(authSettings, { name: integration.name });

  if (!authSetting && !proceedWithoutToken) {
    throw Boom.forbidden('The user has no authentication with the integration.');
  }

  token = authSetting ? authSetting.token : null;

  return integration.adapter(token);
};
