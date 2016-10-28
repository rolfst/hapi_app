import { find, map, flatMap, differenceBy, intersectionBy } from 'lodash';
import Promise from 'bluebird';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';
import * as passwordUtil from '../../../../shared/utils/password';
import createError from '../../../../shared/utils/create-error';
import * as networkRepo from '../../repositories/network';
import * as userRepo from '../../repositories/user';
import * as teamRepo from '../../repositories/team';

export const assertTheNetworkIsNotImportedYet = async (network) => {
  const networkIntegration = await networkRepo.findNetworkIntegration(network.id);

  if (networkIntegration.importedAt) {
    throw createError('403', 'A network with the same external id exists.');
  }
};

export const assertThatUserBelongsToTheNetwork = async (networkId, userId) => {
  const belongs = await userRepo.userBelongsToNetwork(userId, networkId);
  const network = await networkRepo.findNetwork({ userId, id: networkId });
  const result = belongs || network;

  if (!result) {
    throw createError('10002');
  }
};

export const assertExternalIdNotPresentInNetwork = async (userId, networkId, externalId) => {
  const user = await userRepo.findUserInNetworkByExternalId(networkId, externalId);

  if (user && user.id !== userId) {
    throw createError('403', 'Your integration account is already linked with someone else.');
  }
};

export const filterExistingNetworks = async (networksFromIntegration) => {
  const networks = await networkRepo.findAll();
  const pristineNetworks = differenceBy(networksFromIntegration, networks, 'externalId');

  return pristineNetworks;
};

export const mergeAdminsIntoPristineNetwork = async (pristineNetwork) => {
  const network = { ...pristineNetwork };
  const admins = await integrationsAdapter.adminsFromPristineNetworks(network.externalId);

  return { ...network, admins };
};

export const findExternalUser = (user, externalUsers) => {
  const externalUser = find(externalUsers, { email: user.email });

  return externalUser;
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
 * - teamIds
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
  const newUsers = await userRepo.createBulkUsers(
    map(newExternalUsers, (u) => ({ ...u, password: passwordUtil.plainRandom() })));
  const existingUsers = intersectionBy(internalUsers, externalUsers, 'email');

  const usersToAddToNetwork = [...newUsers, ...existingUsers];

  const promises = usersToAddToNetwork.map(employee => {
    const externalUser = findExternalUser(employee, externalUsers);

    return networkRepo.addUser({
      userId: employee.id,
      networkId: network.id,
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
  const existingTeams = await networkRepo.findTeamsForNetwork(network.id);
  const teamsToCreate = differenceBy(externalTeams, existingTeams, 'externalId');
  const teams = map(teamsToCreate, team => ({ ...team, networkId: network.id }));
  const newTeams = await teamRepo.createBulkTeams(teams);

  return [...newTeams, ...existingTeams];
};

export const addUsersToTeam = (users, teams, externalUsers) => {
  const promises = flatMap(users, async (user) => {
    const employee = await userRepo.findUserById(user.userId);
    const externalUser = findExternalUser(employee, externalUsers);

    if (!externalUser) return;

    return externalUser.teamIds.map(teamId => {
      const team = find(teams, { externalId: teamId });

      return teamRepo.addUserToTeam(team.id, user.userId);
    });
  });

  return Promise.all(promises);
};

export const addAdminToNetwork = async (adminUsername, network, externalUsers) => {
  let admin;

  try {
    admin = await userRepo.findUserByUsername(adminUsername);
  } catch (e) {
    const selectedAdmin = find(externalUsers, (user) => {
      return user.email === adminUsername;
    });

    admin = await userRepo.createUser({ ...selectedAdmin });
  }

  await networkRepo.updateSuperUser(network.id, admin.id);

  return admin;
};

export const updateSuperUserForNetwork = async (superUser, networkId) => {
  await networkRepo.setSuperAdmin(networkId, superUser.id);

  return networkRepo.findNetworkById(networkId);
};
