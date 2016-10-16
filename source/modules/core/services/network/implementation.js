import { differenceBy } from 'lodash';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';
import createError from '../../../../shared/utils/create-error';
import * as networkRepo from '../../repositories/network';
import * as userRepo from '../../repositories/user';

export const assertTheNetworkIsNotImportedYet = async (networkPayload) => {
  const network = await networkRepo.findNetwork(networkPayload);

  if (network) {
    throw createError('403', 'A network with the same external id exists.');
  }

  return;
};

export const assertThatUserBelongsToTheNetwork = async (networkId, userId) => {
  const result = await userRepo.userBelongsToNetwork(userId, networkId);

  if (!result) {
    throw createError('10002');
  }

  return;
};

export const filterExistingNetworks = async (networksFromIntegration) => {
  const networks = await networkRepo.findAll();
  const pristineNetworks = differenceBy(networksFromIntegration, networks, 'externalId');

  return pristineNetworks;
};

export const mergeAdminsIntoPristineNetwork = async (pristineNetwork) => {
  const network = { ...pristineNetwork };
  const admins = await integrationsAdapter.adminsFromPristineNetworks(network.externalId);

  return { ...network, admins };
};
