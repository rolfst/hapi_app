import R from 'ramda';
import Promise from 'bluebird';
import { createAdapter } from '../../../../shared/utils/create-adapter';
import * as Logger from '../../../../shared/services/logger';
import createError from '../../../../shared/utils/create-error';
import * as userRepository from '../../../core/repositories/user';
import * as networkRepository from '../../../core/repositories/network';
import * as networkService from '../../../core/services/network';
import * as impl from './implementation';

const logger = Logger.createLogger('INTEGRATIONS/service/sync');

/**
 * Synchronize a single network with his integration partner
 * @param {object} payload
 * @param {string} payload.networkId - The network to synchronize
 * @param {boolean} payload.internal - Wether the action is called internally i.e. via cronjob
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method syncWithIntegrationPartner
 * @return {external:Promise<Network[]>}
 */
export const syncNetwork = async (payload, message) => {
  logger.info('Syncing network', { payload, message });

  if (!payload.internal) {
    const owner = await userRepository.findUserById(message.credentials.id, payload.networkId);
    impl.assertUserIsAdmin(owner);
  }

  const network = await networkRepository.findNetworkById(payload.networkId);
  if (!network) throw createError('404', 'Network not found.');
  // impl.assertNetworkIsSyncable(network); TODO invite users based on importedAt value

  const adapter = await createAdapter(network, 0, { proceedWithoutToken: true });
  const data = await Promise.all([
    adapter.fetchTeams(),
    adapter.fetchUsers(),
    networkService.listAllUsersForNetwork({ networkId: network.id }, message),
    networkRepository.findTeamsForNetwork(network.id),
    userRepository.findAllUsers(),
  ]);

  const [externalTeams, externalUsers, internalUsers, internalTeams, allUsersInSystem] = data;
  const teamActions = impl.createTeamActions(internalTeams, externalTeams);
  await impl.executeTeamActions(network.id, teamActions);

  const internalTeamsAfterSync = await networkRepository.findTeamsForNetwork(network.id);

  const userActions = impl.createUserActions(
    allUsersInSystem,
    internalTeamsAfterSync,
    internalUsers,
    R.uniqBy(R.prop('email'), externalUsers)
  );

  await impl.executeUserActions(network.id, userActions);
};

/**
 * Syncs all integrations in the system with the remote services
 * @param {object} payload - unused
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method syncWithIntegrationPartner
 * @return {external:Promise<Network[]>}
 */
export async function syncWithIntegrationPartner(payload, message) {
  const logError = (err) => logger.error('Error syncing integration partners', { err, message });

  try {
    const allNetworksInSystem = await networkRepository.findAll();
    const syncableNetworks = R.filter(impl.isSyncable);

    console.log('@@@@@@@');
    console.log('@@@@@@@', syncableNetworks(allNetworksInSystem));
    console.log('@@@@@@@');

    return Promise.map(syncableNetworks(allNetworksInSystem), async (network) => {
      try {
        return syncNetwork({ networkId: network.id }, message);
      } catch (err) {
        logError(err);
        throw err;
      }
    });
  } catch (err) {
    logError(err);
    throw err;
  }
}
