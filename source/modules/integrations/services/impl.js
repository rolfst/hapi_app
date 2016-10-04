import { find, differenceBy, intersectionBy } from 'lodash';
import createError from '../../../shared/utils/create-error';
import { findTeamsForNetwork } from '../../core/repositories/network';
import { createBulkTeams } from '../../core/repositories/team';
import * as userRepo from '../../core/repositories/user';
import * as teamRepo from '../../core/repositories/team';

export const findExternalUser = (user, externalUsers) => {
  return find(externalUsers, { email: user.email });
};

export const assertExternalIdNotPresentInNetwork = async (userId, networkId, externalId) => {
  const user = await userRepo.findUserInNetworkByExternalId(networkId, externalId);

  if (user && user.id !== userId) {
    throw createError('403', 'Your integration account is already linked with someone else.');
  }

  return false;
};


/**
 * The external user that is loaded from the integration
 * should contain the following properties:
 *
 * - externalId
 * - username
 * - email
 * - firstName
 * - lastName
 * - dateOfBirth
 * - phoneNum
 * - isAdmin
 * - isActive
 * - teamId
 */

/**
 * We import the users that are being loaded by the external integration.
 * A user is created when the external user is not present in the db.
 * When the user is present in the db they will get added
 * to the network and not be created nor updated.
 * So we can import existing and new users here.
 * @param {array} internalUsers - List of user objects
 * @param {array} externalUsers - The serialized users that are loaded from the integration
 * @param {Network} network - The network object to import the users into
 * @method importUsers
 * @return {User} - Return user objects
 */
export const importUsers = async (internalUsers, externalUsers, network) => {
  const newExternalUsers = differenceBy(externalUsers, internalUsers, 'email');
  const newUsers = await userRepo.createBulkUsers(newExternalUsers);
  const existingUsers = intersectionBy(internalUsers, externalUsers, 'email');

  const usersToAddToNetwork = [...newUsers, ...existingUsers];

  const promises = usersToAddToNetwork.map(employee => {
    const externalUser = findExternalUser(employee, externalUsers);

    return userRepo.addUserToNetwork(employee, network, {
      isActive: externalUser.isActive,
      externalId: externalUser.externalId,
      roleType: externalUser.isAdmin ? 'ADMIN' : 'EMPLOYEE',
    });
  });

  return Promise.all(promises);
};

/**
 * The external team that is loaded from the integration
 * should contain the following properties:
 *
 * - externalId
 * - name
 */

/**
 * @param {array} externalTeams - The serialized teams that are loaded from the integration
 * @param {Network} network - The network object to import the teams into
 * @method importTeams
 * @return {Team} - Return team objects
 */
export const importTeams = async (externalTeams, network) => {
  const existingTeams = await findTeamsForNetwork(network);
  const teamsToCreate = differenceBy(externalTeams, existingTeams, 'externalId')
    .map(team => ({ ...team, networkId: network.id }));

  const newTeams = await createBulkTeams(teamsToCreate);

  return [...newTeams, ...existingTeams];
};

export const addUsersToTeam = (users, teams, externalUsers) => {
  const promises = users.map(user => {
    const teamId = findExternalUser(user, externalUsers).teamId;
    const team = find(teams, { externalId: teamId });

    return teamRepo.addUserToTeam(team, user);
  });

  return Promise.all(promises);
};
