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
 * @param {object} payload - unused
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method syncNetworkWithIntegrationPartner
 * @return {external:Promise<boolean>} - true if success
 */
export async function syncNetworkWithIntegrationPartner(payload, message) {
  try {
    const owner = await userRepository.findUserById(message.credentials.id);

    impl.assertUserIsAdmin(owner);

    const allUsersInSystem = await userRepository.findAllUsers();
    const network = await networkRepository.findNetworkById(payload.networkId);

    impl.assertNetworkIsSyncable(network);

    const adapter = createAdapter(network, 0, { proceedWithoutToken: true });

    await impl.syncNetwork(network, allUsersInSystem, adapter, message);

    return true;
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
    const syncableNetworks = R.filter(impl.isSyncable);

    return Promise.map(syncableNetworks(allNetworksInSystem), async (network) => {
      try {
        const adapter = createAdapter(network, 0, { proceedWithoutToken: true });

        return impl.syncNetwork(network, allUsersInSystem, adapter, message);
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
