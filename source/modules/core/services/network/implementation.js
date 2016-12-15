import _, { find, map, pick, flatMap, differenceBy, intersectionBy, omit } from 'lodash';
import Promise from 'bluebird';
import * as Logger from '../../../../shared/services/logger';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';
import * as passwordUtil from '../../../../shared/utils/password';
import createError from '../../../../shared/utils/create-error';
import * as networkRepo from '../../repositories/network';
import * as userRepo from '../../repositories/user';
import * as teamRepo from '../../repositories/team';

/**
 * @module modules/core/services/network/impl
 */

const logger = Logger.createLogger('CORE/service/networkImpl');

/**
 * @param {string} networkId - network identifier
 * @method assertTheNetworkIsNotImportedYet
 * @throws Error - 10001, 10007
 */
export const assertTheNetworkIsNotImportedYet = async (networkId) => {
  const networkIntegration = await networkRepo.findNetworkIntegration(networkId);

  if (!networkIntegration) {
    throw createError('10001');
  } else if (networkIntegration.importedAt) {
    throw createError('10007', 'A network with the same external id exists.');
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
 * We import the users that are being loaded by the external integration.
 * A user is created when the external user is not present in the db.
 * When the user is present in the db they will get added
 * to the network and not be created nor updated.
 * So we can import existing and new users here.
 * @param {array} externalUsers - The serialized users that are loaded from the integration
 * @param {number} networkId - The id of the network to import the users into
 * @method importUsers
 * @return {User} - Return user objects
 */
export const importUsers = async (externalUsers, networkId) => {
  const internalUsers = await networkRepo.findAllUsersForNetwork(networkId);
  const newExternalUsers = differenceBy(externalUsers, internalUsers, 'username');
  const newUsers = await userRepo.createBulkUsers(
    map(newExternalUsers, (u) => ({ ...u, password: passwordUtil.plainRandom() })));
  const existingUsers = intersectionBy(internalUsers, externalUsers, 'username');
  const usersToAdd = [...newUsers, ...existingUsers];

  return Promise.map(usersToAdd, (employee) => {
    const externalUser = findExternalUser(employee, externalUsers);

    // FIXME: This should adhere to our new external user domain object.
    // The isActive and isAdmin will be deprecated soon.
    return networkRepo.addUser({
      networkId,
      userId: employee.id,
      deletedAt: externalUser.isActive ? null : new Date(),
      externalId: externalUser.externalId,
      roleType: externalUser.isAdmin ? 'ADMIN' : 'EMPLOYEE',
    });
  });
};

export const updateUsersForNetwork = async (externalUsers, networkId) => {
  const internalUsers = await networkRepo.findAllUsersForNetwork(networkId);
  const existingUsers = intersectionBy(externalUsers, internalUsers, 'email');

  return Promise.map(existingUsers, async (user) => {
    const updatedUser = await userRepo.updateUserForNetwork(user, networkId);

    return updatedUser.id;
  });
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

  logger.info('Creating teams', {
    networkId: network.id,
    teams: map(teams, team => pick(team, 'externalId', 'name')),
  });

  const newTeams = await teamRepo.createBulkTeams(teams);

  return [...newTeams, ...existingTeams];
};

export const updateTeamsForNetwork = async (externalTeams, networkId) => {
  const internalTeams = await networkRepo.findTeamsForNetwork(networkId);
  const existingTeams = intersectionBy(externalTeams, internalTeams, 'externalId');
  const existingExternalTeams = map(existingTeams, (team) => {
    const internalTeam = find(internalTeams, (intTeam) => {
      return (intTeam.externalId === team.externalId);
    });

    return { ...team, id: internalTeam.id };
  });

  return Promise.map(existingExternalTeams, async (team) => {
    await teamRepo.updateTeam(team.id, omit(team, 'id'));

    return team.id;
  });
};

export const addUsersToTeam = (internalUsers, internalTeams, externalUsers) => {
  const promises = flatMap(internalUsers, async (internalUser) => {
    const externalUser = findExternalUser(internalUser, externalUsers);
    if (!externalUser) return;

    // Make sure we translate the team ids to our internal's and not by the external's
    // and filter out null values to avoid undefined errors while adding the user to a team.
    externalUser.teamIds = _.filter(map(externalUser.teamIds, externalTeamId => {
      const matchingTeam = find(internalTeams, { externalId: externalTeamId });

      return matchingTeam.id || null;
    }), _.isDefined);

    return Promise.map(externalUser.teamIds, async (teamId) => {
      return teamRepo.addUserToTeam(teamId, internalUser.id);
    });
  });

  return Promise.all(promises);
};

export const addAdminToNetwork = async (adminUsername, network, externalUsers) => {
  let admin = await userRepo.findUserByUsername(adminUsername);

  if (!admin) {
    const selectedAdmin = find(externalUsers, (user) => {
      return user.email === adminUsername;
    });

    admin = await userRepo.createUser({ ...selectedAdmin });
  }

  await networkRepo.updateSuperUser(network.id, admin.id);

  return admin;
};

export const updateSuperUserForNetwork = async (userId, networkId) => {
  await networkRepo.setSuperAdmin(networkId, userId);

  return networkRepo.findNetworkById(networkId);
};
