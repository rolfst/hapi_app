import Promise from 'bluebird';
import R from 'ramda';
import { createAdapter } from '../../../../shared/utils/create-adapter';
import * as Logger from '../../../../shared/services/logger';
import * as userRepository from '../../../core/repositories/user';
import * as networkRepository from '../../../core/repositories/network';
import * as impl from './implementation';

const logger = Logger.createLogger('INTEGRATIONS/service/sync');

/**
 * syncNetwork syncs users and teams from network with external network
 * @param {object} network - network to sync with
 * @param {object} adapter - connector that connects to externalNetwork
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method syncNetwork
 * @return {external:Promise<object>} - containing all synced users and teams
 */
export async function syncNetwork(network, allUsersInSystem = [], adapter, message) {
  try {
    const externalTeams = await impl.getExternalTeams(network, adapter, message);
    const externalUsers = impl.filterExternalUserDuplications(
      await adapter.fetchUsers(network.externalId));
    const syncTeamsResult = await impl.syncTeams(network.id, externalTeams);
    const syncUsersResult = await impl.syncUsersWithNetwork(
      network.id, externalUsers, allUsersInSystem);
    await impl.syncUsersWithTeams(network.id, externalUsers);

    logger.info('Finished syncing network', {
      networkId: network.id,
      addedTeams: syncTeamsResult.added,
      changedTeams: syncTeamsResult.changed,
      deletedTeams: syncTeamsResult.deleted,
      syncedUsers: syncUsersResult,
    });
  } catch (err) {
    logger.warn('Error syncing network', { err, message });
    throw err;
  }
}

/**
 * Syncs all integrations in the system with the remote services
 * @param {object} payload - unused
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method syncWithIntegrationPartner
 * @return {external:Promise<Network[]>}
 */
export async function syncWithIntegrationPartner(payload, message) {
  try {
    const allUsersInSystem = await userRepository.findAllUsers();
    const allNetworksInSystem = await networkRepository.findAll();
    const syncableNetworks = R.filter(R.and(R.prop('hasIntegration'), R.prop('importedAt')));

    return Promise.map(syncableNetworks(allNetworksInSystem), async (network) => {
      try {
        const adapter = createAdapter(network, 0, { proceedWithoutToken: true });

        return syncNetwork(network, allUsersInSystem, adapter, message);
      } catch (err) {
        logger.warn('Error syncing integration partners', { err, message });
        throw err;
      }
    });
  } catch (err) {
    logger.warn('Error syncing integration partners', { err, message });
    throw err;
  }
}
