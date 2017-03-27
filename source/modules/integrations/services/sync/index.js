const R = require('ramda');
const Promise = require('bluebird');
const passwordUtil = require('../../../../shared/utils/password');
const adapterUtil = require('../../../../shared/utils/create-adapter');
const createError = require('../../../../shared/utils/create-error');
const userRepository = require('../../../core/repositories/user');
const networkRepository = require('../../../core/repositories/network');
const networkService = require('../../../core/services/network');
const impl = require('./implementation');

const logger = require('../../../../shared/services/logger')('INTEGRATIONS/service/sync');

/**
 * Synchronize a single network with his integration partner
 * @param {object} payload
 * @param {string} payload.networkId - The network to synchroniz
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method syncWithIntegrationPartner
 * @return {external:Promise<Network[]>}
 */
const syncNetwork = async (payload, message) => {
  try {
    logger.debug('Started network synchronization', { payload, message });

    const network = await networkRepository.findNetworkById(payload.networkId);
    if (!network) throw createError('404', 'Network not found.');
    if (!network.hasIntegration) throw createError('10001');
    if (!impl.isSyncable(network)) throw createError('10009');
    // TODO invite users based on importedAt value

    const adapter = await adapterUtil.createAdapter(network, 0, { proceedWithoutToken: true });
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
      externalUsers
    );

    await impl.executeUserActions(network.id, userActions);

    const actions = {
      teamActions: R.omit(['data'], teamActions),
      userActions: R.pipe(
        R.omit(['data']),
        R.map(R.map(R.pick(['id', 'externalId', 'email'])))
      )(userActions),
    };

    logger.debug('Successfully synced network', { payload, actions });

    return actions;
  } catch (err) {
    logger.error('Failed network synchronization', { payload, message, err });

    throw err;
  }
};

/**
 * Synchronize a single network with his integration partner
 * @param {object} payload
 * @param {string} payload.ownerEmail - The username of the user that should
 * be assigned as owner of the network
 * @param {boolean} payload.networkId - The id of the network to import
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method importNetwork
 * @return {external:Promise<Network[]>}
 */
const importNetwork = async (payload, message) => {
  try {
    logger.debug('Started network import', { payload, message });

    const network = await networkRepository.findNetworkById(payload.networkId);
    if (!network) throw createError('404', 'Network not found.');
    if (!!network.importedAt) throw createError('10007');
    if (!network.hasIntegration) throw createError('10001');

    const adapter = await adapterUtil.createAdapter(network, 0, { proceedWithoutToken: true });
    const externalUsers = await adapter.fetchUsers();
    const externalAdmin = R.find(R.propEq('email', payload.ownerEmail), externalUsers);
    if (!externalAdmin) throw createError('10006');

    let admin = await userRepository.findUserBy({ email: externalAdmin.email });

    if (!admin) {
      const password = passwordUtil.plainRandom();
      admin = await userRepository.createUser(R.merge(externalAdmin, { password }));
    }

    await networkRepository.updateNetwork(network.id, { userId: admin.id });
    await userRepository.setNetworkLink({
      networkId: network.id,
      userId: admin.id,
    }, {
      networkId: network.id,
      userId: admin.id,
      roleType: 'ADMIN',
      deletedAt: null,
      externalId: externalAdmin.externalId,
    });

    await networkRepository.setImportDateOnNetworkIntegration(network.id);
    const syncResult = await syncNetwork({ networkId: network.id, internal: true }, message);

    logger.debug('Finished importing users for network', { syncResult });
  } catch (err) {
    logger.error('Failed importing network', { payload, message, err });

    throw err;
  }
};

/**
 * Syncs all integrations in the system with the remote services
 * @param {object} payload - unused
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method syncWithIntegrationPartner
 * @return {external:Promise<Network[]>}
 */
async function syncWithIntegrationPartner(payload, message) {
  const logError = (err) => logger.error('Error syncing integration partners', { err, message });

  try {
    const allNetworksInSystem = await networkRepository.findAll();
    const syncableNetworks = R.filter(impl.isSyncable);

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

exports.importNetwork = importNetwork;
exports.syncNetwork = syncNetwork;
exports.syncWithIntegrationPartner = syncWithIntegrationPartner;
