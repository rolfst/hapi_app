import Promise from 'bluebird';
import _, {
  flatMap,
  filter,
  isEqual,
  pick,
  find,
  omit,
  map,
  differenceBy,
  intersectionBy,
} from 'lodash';
import * as teamService from '../../../core/services/team';
import * as networkService from '../../../core/services/network';
import * as networkServiceImpl from '../../../core/services/network/implementation';
import * as networkRepo from '../../../core/repositories/network';
import * as userRepo from '../../../core/repositories/user';
import * as teamRepo from '../../../core/repositories/team';
import * as Logger from '../../../../shared/services/logger';

/**
 * @module modules/integrations/services/sync/impl
 */

const logger = Logger.getLogger('INTEGRATIONS/services/sync');

export const getRemovableUsersForNetwork = async (externalUsers, networkId, message) => {
  const internalUsers = await networkService.listActiveUsersForNetwork(
    { networkId }, message);
  const removableUsers = differenceBy(internalUsers, externalUsers, 'email');

  return map(removableUsers, 'id');
};

/**
 * @param {ExternalTeam[]} externalTeams - the teams in the external system that will not be used to
 * remove the internal teams.
 * @param {string} networkId - the networkId where to import to
 * @method getRemovableTeamsIdsForNetwork
 * @return {external:Promise.<string[]>} Promise containing removed teamids
 */
export const getRemovableTeamsIdsForNetwork = async (externalTeams, networkId, message) => {
  const internalTeams = await networkService.listTeamsForNetwork({ networkId }, message);
  const removableTeams = differenceBy(internalTeams, externalTeams, 'externalId');

  return map(removableTeams, 'id');
};

/**
 * @param {ExternalUsers[]} - the users in the external system that will not be used to
 * remove the internal users.
 * @param {string} networkId - the networkId where to import to
 * @method removeUserFromNetwork
 * @return {external:Promise.<string[]>} Promise containing removed userids
 */
export const removeUsersFromNetwork = async (externalUsers, networkId, message) => {
  const removableUserIds = await getRemovableUsersForNetwork(externalUsers, networkId, message);
  const removableUsers = await Promise.map(removableUserIds, (userId) => {
    return userRepo.findUserMetaDataForNetwork(userId, networkId);
  });
  const removedUsersIds = await Promise.map(removableUsers,
    async (user) => {
      const userInfo = { ...user, isAdmin: user.roleType === 'ADMIN' };
      await userRepo.updateUserForNetwork(userInfo, networkId, false);

      return user.id;
    });

  logger.info('Successfully users removed from network',
    { removedUsers: removedUsersIds, message });

  return removedUsersIds;
};

/**
 * Fetches users from integration
 * @param {object} network - network to fetch the users for
 * @param {object} adapter - adapter that allows to comunicate with integrations network
 * @method getExternalUsers
 * @return {external:Promise.<ExternalUser[]>} {@link module:modules/adapters/pmt~ExternalUser} -
 * Promise that lists all fetched external users
*/
export const getExternalUsers = async (network, adapter, message) => {
  return adapter.fetchUsers(network, message);
};

/**
 * Fetches teams from integration
 * @param {object} network - network to fetch the teams for
 * @param {object} adapter - adapter that allows to comunicate with integrations network
 * @method getExternalUsers
 * @return {external:Promise.<ExternalTeam[]>} {@link module:modules/adapters/pmt~ExternalTeam} -
 * Promise that lists all fetched external teams
*/
export const getExternalTeams = async (network, adapter, message) => {
  return adapter.fetchTeams(network, message);
};

/**
 * Imports not already imported users
 * @param {ExternalUser[]} externalUsers - list of
 * {@link module:adapters/pmt~ExternalUser external} users to import
 * @param {object} network - network to fetch the users for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method importUsersInNetwork
 * @return {external:Promise.<string[]>}  - Promise ids of all imported users
 * */
export const importUsersInNetwork = async (externalUsers, network, message) => {
  const importedUsers = await networkService.importUsers({
    externalUsers,
    network,
  }, message);
  const importedUsersIds = map(importedUsers, 'userId');
  logger.info('Successfully imported users into network',
    { importedUsers: importedUsersIds, message });

  return importedUsersIds;
};
/**
 * Updates already imported users
 * @param {ExternalUser[]} externalUsers - list of
 * {@link module:adapters/pmt~ExternalUser external} users to import
 * @param {array} externalUsers - list of external users to update
 * if required for that user
 * @param {object} network - network to fetch the teams for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method updateUsers
 * @return {external:Promise.<string[]>}  - Promise ids of all updated users
 */
export const updateUsers = async (externalUsers, network, message) => {
  const updatedUsersIds = await networkService.updateUsersForNetwork({
    externalUsers,
    networkId: network.id,
  }, message);
  logger.info('Successfully users updated from network',
    { updatedUsers: updatedUsersIds, message });

  return updatedUsersIds;
};

/**
 * imports not already imported teams
 * @param {ExternalTeam[]} externalTeams - list of
 * {@link module:adapters/pmt~ExternalTeam external} teams to import
 * @param {object} network - network to fetch the teams for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method importTeamsInNetwork
 * @return {external:Promise.<ExternalTeam[]>} {@link module:modules/adapters/pmt~ExternalTeam} -
 * Promise that lists all imported external teams ids
 */
export const importTeamsInNetwork = async (externalTeams, network, message) => {
  const importedTeams = await networkService.importTeams({
    externalTeams,
    network,
  }, message);
  const importedTeamsIds = map(importedTeams, 'id');
  logger.info('Successfully teams imported from network',
    { importedTeams: importedTeamsIds, message });

  return importedTeamsIds;
};

/**
 * updates already imported teams
 * @param {externalTeam[]} externalTeams - list of {@link module:adapters/pmt~ExternalTeam external}
 * teams to update if required for that team
 * @param {object} network - network to fetch the teams for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method updateTeamsFromNetwork
 * @return ids of all updated teams
 */
export const updateTeamsFromNetwork = async (externalTeams, network, message) => {
  const updatedTeamsIds = await networkService.updateTeamsForNetwork({
    externalTeams,
    networkId: network.id,
  }, message);
  logger.info('Successfully teams updated from network',
    { updatedTeams: updatedTeamsIds, message });

  return updatedTeamsIds;
};

/**
 * @param {externalTeam[]} externalTeams - list of {@link module:adapters/pmt~ExternalTeam external}
 * teams in the external system that will not be used to remove the internal teams.
 * @param {string} networkId - the networkId where to import to
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method removeTeamsFromNetwork
 * @return {Promise} Promise containing removed teamids
 */
export const removeTeamsFromNetwork = async (externalTeams, networkId, message) => {
  const removableTeamsIds = await getRemovableTeamsIdsForNetwork(externalTeams, networkId, message);
  const removedTeamsIds = await teamService.deleteTeamsByIds(
    { teamIds: removableTeamsIds, networkId }, message);

  logger.info('Successfully teams removed from network',
    { removedTeams: removedTeamsIds, message });

  return removedTeamsIds;
};

/**
 * @param {externalUser[]} externalUsers - list of
 * {@link module:adapters/pmt~ExternalUser external} teams
 * in the external system that will be added
 * @param {string} networkId - the networkId where to import to
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method addUsersToTeams
 * @return {Promise} Promise containing removed teamids
 */
export const addUsersToTeams = async (externalUsers, networkId, message) => {
  const externalUserIds = externalUsers;
  return networkService.addUsersToTeams({ externalUserIds, networkId }, message);
};

/**
 * This step synchronises the teams.
 * @param {string} networkId - The network to sync the users for
 * @param {Array<ExternalTeam>} _externalTeams - The teams that come from the external system
 * @method syncTeams
 * @return {Team} - Return team objects
 */
export async function syncTeams(networkId, _externalTeams) {
  const internalTeams = await networkService.listTeamsForNetwork({ networkId });
  // We are setting the networkId here because the external team object
  // does not contain the networkId yet.
  const externalTeams = map(_externalTeams, t => ({ ...t, networkId }));

  const nonExistingTeams = differenceBy(externalTeams, internalTeams, 'externalId');
  const teamsToDelete = differenceBy(internalTeams, externalTeams, 'externalId');

  const existingTeams = intersectionBy(internalTeams, externalTeams, 'externalId');
  // Because existingTeams contains our internal objects. We have
  // to get the updated values from the matching external team.
  const teamsToUpdate = _(existingTeams)
    .map(internalTeam => {
      const matchingExternalTeam = find(externalTeams, { externalId: internalTeam.externalId });
      const externalTeamValues = pick(matchingExternalTeam, 'name', 'description');
      const internalTeamValues = pick(internalTeam, 'name', 'description');

      // We return null here so we are sure that we only update the teams that
      // are actually changed instead of updating all the teams against the database.
      if (isEqual(externalTeamValues, internalTeamValues)) return null;

      return { ...internalTeam, ...externalTeamValues };
    })
    .filter(_.isDefined)
    .value();

  await Promise.map(teamsToDelete, team => teamRepo.deleteById(team.id));
  await Promise.map(teamsToUpdate, team => teamRepo.updateTeam(team.id, team));
  await teamRepo.createBulkTeams(map(nonExistingTeams, t => omit(t, 'id')));

  return true;
}

/**
 * This step synchronises the link between an user and the network it belongs to.
 * When an user is removed we will delete it from the network, but never delete it in our system.
 * This is due foreign key cascading. Else all the linked messages etc will be deleted as well.
 * This requires the users to be already imported by the import script to avoid wrong behaviour.
 * @param {string} networkId - The network to sync the users for
 * @param {Array<ExternalUser>} externalUsers - The users that come from the external system
 * @method syncUsersWithNetwork
 * @return {boolean} - Return success boolean
 */
export async function syncUsersWithNetwork(networkId, externalUsers) {
  const network = await networkRepo.findNetworkById(networkId);
  const internalUsers = await networkService.listAllUsersForNetwork({
    networkId }, { credentials: network.superAdmin });
  const nonExistingUsers = differenceBy(externalUsers, internalUsers, 'externalId');
  await networkServiceImpl.importUsers(nonExistingUsers, networkId);

  const usersToDelete = differenceBy(internalUsers, externalUsers, 'externalId');
  await Promise.map(usersToDelete, user => userRepo.removeFromNetwork(user.id, networkId));

  const previouslyDeletedUsers = filter(internalUsers, user => !!user.deletedAt);
  const usersToAddToNetwork = differenceBy(previouslyDeletedUsers, externalUsers, 'deletedAt');
  await Promise.map(usersToAddToNetwork, user =>
    networkRepo.addUser({ networkId, userId: user.id }));

  return true;
}

/**
 * Calculate which users have to be synced.
 * @param {Array<ExternalUser>} externalUsers - The users that come from the external system
 * @param {Array<User>} internalUsers - The users that come from the internal system
 * @param {Array<Team>} internalTeams - The teams that come from the external system
 * @method getOutOfSyncUsersForTeamLinking
 * @return {Array<User>}
 */
export function getOutOfSyncUsersForTeamLinking(externalUsers, internalUsers, internalTeams) {
  return _(externalUsers)
    .map(externalUser => ({
      ...externalUser,
      teamIds: map(externalUser.teamIds, teamId => find(internalTeams, { externalId: teamId }).id),
    }))
    .filter(externalUser => {
      const matchingInternalUser = find(internalUsers, { externalId: externalUser.externalId });

      return !isEqual(externalUser.teamIds, matchingInternalUser.teamIds);
    })
    .value();
}

export function getMatchingInternalTeam(externalId, internalTeams) {
  const matchingInternalTeam = find(internalTeams, { externalId });
  if (!matchingInternalTeam) return null;

  return matchingInternalTeam;
}

/**
 * Replace team id from an external user by the id of our internal
 * team matched by the externalId value
 * @param {ExternalUser} externalUser - The user that come from the external system
 * @param {User} internalUser - The user that come from the internal system
 * @param {Array<Team>} internalTeams - The teams that come from the external system
 * @method replaceExternalTeamIds
 * @return {ExternalUser}
 */
export function replaceExternalTeamIds(externalUser, internalUser, internalTeams) {
  return {
    ...externalUser,
    teamIds: _(externalUser.teamIds)
      .map(teamId => getMatchingInternalTeam(teamId, internalTeams))
      .map(internalTeam => internalTeam ? internalTeam.id : null)
      .filter(_.isDefined)
      .value(),
  };
}

/**
 * Get internal user by external id
 * @param {number} externalId - The external id that matches the internal and external user
 * @param {Array<User>} internalUsers - The user lookup to find the user in
 * @method getInternalUserByExternalId
 * @return {User}
 */
export function getInternalUserByExternalId(externalId, internalUsers) {
  return find(internalUsers, { externalId });
}

/**
 * This step synchronises the link between an user and the teams it belong to.
 * This requires the users and teams to be synced already to avoid wrong behaviour.
 * @param {string} networkId - The network to sync the users for
 * @param {Array<ExternalUser>} externalUsers - The users that come from the external system
 * @method syncUsersWithTeams
 * @return {boolean} - Return success boolean
 */
export async function syncUsersWithTeams(networkId, externalUsers) {
  const network = await networkRepo.findNetworkById(networkId);
  const internalUsers = await networkService.listAllUsersForNetwork({
    networkId }, { credentials: network.superAdmin });
  const internalTeams = await networkService.listTeamsForNetwork({ networkId });

  // We want to make sure we only sync the users that are out-of-sync.
  const usersOutOfSync = getOutOfSyncUsersForTeamLinking(
    externalUsers, internalUsers, internalTeams);

  logger.info('Syncing users that are out-of-sync', { users: usersOutOfSync });

  const removeUserFromTeamsPromises = flatMap(usersOutOfSync, externalUser => {
    const matchingInternalUser = getInternalUserByExternalId(
      externalUser.externalId, internalUsers);
    const externalUserWithReplacedTeamIds = replaceExternalTeamIds(
      externalUser, matchingInternalUser, internalTeams);

    return _(matchingInternalUser.teamIds)
      .difference(externalUserWithReplacedTeamIds.teamIds)
      .map(teamId => teamRepo.removeUserFromTeam(teamId, matchingInternalUser.id))
      .value();
  });

  const addUserToTeamsPromises = flatMap(externalUsers, externalUser => {
    const matchingInternalUser = getInternalUserByExternalId(
      externalUser.externalId, internalUsers);
    const externalUserWithReplacedTeamIds = replaceExternalTeamIds(
      externalUser, matchingInternalUser, internalTeams);

    return map(externalUserWithReplacedTeamIds.teamIds, teamId =>
      teamRepo.addUserToTeam(teamId, matchingInternalUser.id));
  });

  await Promise.all([...addUserToTeamsPromises, ...removeUserFromTeamsPromises]);
}
