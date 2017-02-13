import { differenceBy } from 'lodash';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';
import * as networkRepo from '../../repositories/network';

/**
 * @module modules/core/services/network/implementation
 */

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
