import { find } from 'lodash';
import createError from './create-error';
import * as userRepo from '../../modules/core/repositories/user';
import pmtAdapter from '../../adapters/pmt/adapter';

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

export const createAdapter = async (network, userId, options = {}) => {
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
