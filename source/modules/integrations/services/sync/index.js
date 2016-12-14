import Promise from 'bluebird';
import { map, isNil } from 'lodash';
import * as adapterUtil from '../../../../shared/utils/create-adapter';
import * as Logger from '../../../../shared/services/logger';
import * as networkService from '../../../core/services/network';
import * as integrationService from '../../../core/services/integration';
import * as impl from './implementation';

const logger = Logger.createLogger('INTEGRATIONS/service/sync');

function createSyncHolders(integration) {
  const adapterFactory = adapterUtil.createAdapterFactory(
    integration.name,
    [],
    { proceedWithoutToken: true });

  return { integration, adapterFactory };
}

// /**
//  * syncUsers syncs users from network with external network
//  * @param {array} externalUsers - list of externalUsers to sync with
//  * @param {object} network - network to sync with
//  * @param {object} message - metadata for this request
//  * @method syncUsers
//  * return {array} all synced users
//  */
// const syncUsers = async (externalUsers, network, message) => {
//   const importedUsersIds = await impl.importUsersInNetwork(externalUsers, network, message);
//   const updatedUsersIds = await impl.updateUsers(externalUsers, network, message);
//   const removedUsersIds = await impl.removeUsersFromNetwork(externalUsers, network.id, message);
//   await impl.addUsersToTeams(externalUsers, network.id, message);
//
//   return [...importedUsersIds, ...updatedUsersIds, ...removedUsersIds];
// };
//
// /**
//  * syncTeams syncs teams from network with external network
//  * @param {array} externalTeams - list of external teams to sync with
//  * @param {object} network - network to sync with
//  * @param {object} message - metadata for this request
//  * @method syncTeams
//  * return {array} all synced teams
//  */
// const syncTeams = async (externalTeams, network, message) => {
//   const importedTeamsIds = await impl.importTeamsInNetwork(externalTeams, network, message);
//   const updatedTeamsIds = await impl.updateTeamsFromNetwork(externalTeams, network, message);
//   const removedTeamsIds = await impl.removeTeamsFromNetwork(externalTeams, network.id, message);
//
//   return [...importedTeamsIds, ...updatedTeamsIds, ...removedTeamsIds];
// };

/**
 * syncNetwork syncs users and teams from network with external network
 * @param {object} network - network to sync with
 * @param {object} adapter - connector that connects to externalNetwork
 * @param {object} message - metadata for this request
 * @method syncNetwork
 * return {map} - containing all synced users and teams
 */
export async function syncNetwork(network, adapter, message) {
  try {
    const externalTeams = await impl.getExternalTeams(network, adapter, message);
    const externalUsers = await adapter.fetchUsers(network.externalId);
    await impl.syncTeams(network.id, externalTeams);
    await impl.syncUsersWithNetwork(network.id, externalUsers);
    await impl.syncUsersWithTeams(network.id, externalUsers);

    return true;
  } catch (err) {
    logger.warn('Error syncing network', { err, message });
    throw err;
  }
}

function filterImportedNetwork(network) {
  return !isNil(network.importedAt);
}

/**
 * Syncs all integrations in the system with the remote services
 * @param {object} payload - unused
 * @param {object} message - metadata for this request
 * @method syncWithIntegrationPartner
 */
export async function syncWithIntegrationPartner(payload, message) {
  logger.info('finding all integrations', { message });
  const integrations = await integrationService.list({}, message);
  logger.info('found integrations', { integrations, message });
  const syncHolders = map(integrations, createSyncHolders);

  return Promise.map(syncHolders, async (syncHolder) => {
    const attributes = { integrationName: syncHolder.integration.name };
    logger.info('finding all networks for integration', { attributes, message });
    const networks = await Promise.filter(
      networkService.listNetworksForIntegration(attributes, message),
      filterImportedNetwork);
    logger.info('found networks for integration', { networks, message });
    const networksToSync = Promise.map(networks,
      (network) => {
        const adapter = syncHolder.adapterFactory.create(network);
        return syncNetwork(network, adapter, message);
      });

    return Promise.all(networksToSync);
  });
}
