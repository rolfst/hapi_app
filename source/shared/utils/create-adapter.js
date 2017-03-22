const { find } = require('lodash');
const createError = require('./create-error');
const userRepo = require('../../modules/core/repositories/user');
const pmtAdapter = require('../../modules/integrations/adapters/pmt/adapter');

const availableIntegrations = [{
  name: 'PMT',
  adapter: pmtAdapter,
}];

const assertNetworkHasIntegration = (network) => {
  if (!network.hasIntegration) {
    throw createError('10001', 'The network doesn\'t have a linked integration.');
  }
};

const assertNetworkHasExternalId = (network) => {
  if (!network.externalId) {
    throw createError('403', 'Network has no externalId value.');
  }
};

const createAdapter = async (network, userId, options = {}) => {
  assertNetworkHasIntegration(network);
  assertNetworkHasExternalId(network);

  let { integrations, proceedWithoutToken } = options;
  proceedWithoutToken = proceedWithoutToken || false;
  integrations = integrations || availableIntegrations;

  let userToken;

  if (!proceedWithoutToken) {
    userToken = (await userRepo.findNetworkLink({ userId, networkId: network.id })).userToken;
  }

  if (!userToken && !proceedWithoutToken) {
    throw createError('403', 'User not authenticated with integration.');
  }

  const integration = find(integrations, { name: network.integrations[0] });
  if (!integration) throw createError('403', 'Couldn\'t find integration with adapter.');

  return integration.adapter(network, userToken);
};

// exports of functions
exports.createAdapter = createAdapter;
