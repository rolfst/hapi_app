import _ from 'lodash';
import IntegrationNotFound from 'common/errors/integration-not-found';
import pmtAdapter from 'adapters/pmt/adapter';

const availableIntegrations = ({
  1: {
    name: 'PMT',
    adapter: pmtAdapter,
  },
});

export default (network, authSettings = [], integrations = availableIntegrations) => {
  const integration = integrations[network.Integrations[0].id];
  if (!integration) throw IntegrationNotFound;

  let token = null;

  if (authSettings) {
    const authSetting = _.find(authSettings, { name: integration.name });

    token = authSetting ? authSetting.token : null;
  }

  return integration.adapter(token);
};
