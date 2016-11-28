import Promise from 'bluebird';
import { map, differenceBy } from 'lodash';
import * as teamService from '../../../core/services/team';
import * as networkService from '../../../core/services/network';
import * as userRepo from '../../../core/repositories/user';
import * as Logger from '../../../../shared/services/logger';

const logger = Logger.getLogger('INTEGRATIONS/services/sync');

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
