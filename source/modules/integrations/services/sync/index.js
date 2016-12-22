import Promise from 'bluebird';
import { map, isNil, pick } from 'lodash';
import * as Logger from '../../../../shared/services/logger';
import * as networkService from '../../../core/services/network';
import * as userRepository from '../../../core/repositories/user';
import * as integrationService from '../../../core/services/integration';
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
    logger.info('Finding all integrations', { message });
    const integrations = await integrationService.list({}, message);
    logger.info('Found integrations', { integrations, message });
    const syncHolders = map(integrations, impl.createSyncHolders);
    const allUsersInSystem = await userRepository.findAllUsers();

    return Promise.map(syncHolders, async (syncHolder) => {
      try {
        const attributes = { integrationName: syncHolder.integration.name };
        logger.info('Finding all networks for integration', { attributes, message });
        const networks = await Promise.filter(
          networkService.listNetworksForIntegration(attributes, message),
          network => !isNil(network.importedAt));

        logger.info('Found networks for integration', {
          ...map(networks, network => pick(network,
            'id', 'name', 'externlId', 'importedAt', 'hasIntegration')),
          message });

        const networksToSync = Promise.map(networks,
          (network) => {
            const adapter = syncHolder.adapterFactory.create(network);
            return syncNetwork(network, allUsersInSystem, adapter, message);
          });

        return Promise.all(networksToSync);
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
