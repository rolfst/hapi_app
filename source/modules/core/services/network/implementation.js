import { differenceBy } from 'lodash';
import * as networkRepo from '../../repositories/network';
import createError from '../../../../shared/utils/create-error';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';

export const assertTheNetworkIsNotImportedYet = async (networkPayload) => {
  const network = await networkRepo.findNetwork(networkPayload);
  if (network) throw createError('403', 'A network with the same external id exists.');

  return false;
};

export const filterExistingNetworks = async (networksFromIntegration) => {
  const networks = await networkRepo.findAll({ attributes: ['externalId'] });
  const pristineNetworks = differenceBy(networksFromIntegration, networks, 'externalId');

  return pristineNetworks;
};

export const mergeAdminsIntoPristineNetwork = async (pristineNetwork) => {
  const network = { ...pristineNetwork };
  const admins = await integrationsAdapter.adminsFromPristineNetworks(network.externalId);
  network.admins = admins;

  return network;
};
