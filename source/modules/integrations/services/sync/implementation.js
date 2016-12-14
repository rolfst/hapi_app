import Promise from 'bluebird';
import _, {
  flatMap,
  includes,
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

const logger = Logger.createLogger('INTEGRATIONS/services/sync');

export const getRemovableUsersForNetwork = async (externalUsers, networkId, message) => {
  const internalUsers = await networkService.listActiveUsersForNetwork(
    { networkId }, message);
  const removableUsers = differenceBy(internalUsers, externalUsers, 'email');

  return map(removableUsers, 'id');
};

export const getRemovableTeamsIdsForNetwork = async (externalTeams, networkId, message) => {
  const internalTeams = await networkService.listTeamsForNetwork({ networkId }, message);
  const removableTeams = differenceBy(internalTeams, externalTeams, 'externalId');

  return map(removableTeams, 'id');
};

/**
 * @param {array} externalUsers - the users in the external system that will not be used to
 * remove the internal users.
 * @param {string} networkId - the networkId where to import to
 * @method removeUserFromNetwork
 * @return {Promise} Promise containing removed userids
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
 * fetches users from integration
 * @param {object} network - network to fetch the users for
 * @param {object} adapter - adapter that allows to comunicate with integrations network
 * @method getExternalUsers
 * @return {Promise} Promise that lists all fetched external users
*/
export const getExternalUsers = async (network, adapter, message) => {
  return adapter.fetchUsers(network, message);
};

/**
 * fetches teams from integration
 * @param {object} network - network to fetch the teams for
 * @param {object} adapter - adapter that allows to comunicate with integrations network
 * @method getExternalUsers
 * @return {Promise} Promise that lists all fetched external teams
*/
export const getExternalTeams = async (network, adapter, message) => {
  return adapter.fetchTeams(network, message);
};

/**
 * imports not already imported users
 * @param {array} externalUsers - list of external users to import
 * @param {object} network - network to fetch the users for
 * @param {object} message - metadata for this request
 * @method importUsersInNetwork
 * @return ids of all imported teams
 */
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
 * updates already imported users
 * @param {array} externalUsers - list of external users to update
 * if required for that user
 * @param {object} network - network to fetch the teams for
 * @param {object} message - metadata for this request
 * @method updateUsers
 * @return ids of all updated users
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
 * @param {array} externalTeams - list of external teams to import
 * @param {object} network - network to fetch the teams for
 * @param {object} message - metadata for this request
 * @method importTeamsInNetwork
 * @return ids of all imported teams
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
 * @param {array} externalTeams - list of external Teams to update
 * if required for that team
 * @param {object} network - network to fetch the teams for
 * @param {object} message - metadata for this request
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
 * @param {array} externalTeams - the teams in the external system that will not be used to
 * remove the internal teams.
 * @param {string} networkId - the networkId where to import to
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

export const addUsersToTeams = async (externalUsers, networkId, message) => {
  const externalUserIds = externalUsers;
  return networkService.addUsersToTeams({ externalUserIds, networkId }, message);
};

/**
 * This step synchronises the teams.
 * @param {number} networkId - The network to sync the users for
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
 * @param {number} networkId - The network to sync the users for
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
    .map(externalUser => find(internalUsers, { externalId: externalUser.externalId }))
    .value();
}

/**
 * This step synchronises the link between an user and the teams it belong to.
 * This requires the users and teams to be synced already to avoid wrong behaviour.
 * @param {number} networkId - The network to sync the users for
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

  const removeUserFromTeamsPromises = flatMap(usersOutOfSync, internalUser => {
    const matchingExternalUser = find(externalUsers, { externalId: internalUser.externalId });
    const teamsForUser = map(internalUser.teamIds, teamId => find(internalTeams, { id: teamId }));
    const externalTeamIdsForUser = map(teamsForUser, 'externalId');

    return _(externalTeamIdsForUser)
      .difference(matchingExternalUser.teamIds)
      .map(externalTeamId => find(internalTeams, { externalId: externalTeamId }))
      .map(internalTeam => teamRepo.removeUserFromTeam(internalTeam.id, internalUser.id))
      .value();
  });

  await Promise.all(removeUserFromTeamsPromises);

  // TODO: We should make sure the teams that the values of externalUser.teamIds consists
  // of teams that are already imported.
  const addUserToTeamsPromises = flatMap(externalUsers, externalUser => {
    const matchingInternalUser = find(internalUsers, { externalId: externalUser.externalId });
    const internalTeamIds = _(internalTeams)
      .filter(internalTeam => includes(externalUser.teamIds, internalTeam.externalId))
      .map('id')
      .value();

    return map(internalTeamIds, teamId =>
      teamRepo.addUserToTeam(teamId, matchingInternalUser.id));
  });

  await Promise.all(addUserToTeamsPromises);
}
