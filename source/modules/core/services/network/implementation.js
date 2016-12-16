import { find, map, pick, flatMap, differenceBy, intersectionBy, omit } from 'lodash';
import Promise from 'bluebird';
import * as Logger from '../../../../shared/services/logger';
import * as Mailer from '../../../../shared/services/mailer';
import configurationMail from '../../../../shared/mails/configuration-invite';
import configurationMailNewAdmin from '../../../../shared/mails/configuration-invite-newadmin';
import { createAdapter } from '../../../../shared/utils/create-adapter';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';
import * as passwordUtil from '../../../../shared/utils/password';
import createError from '../../../../shared/utils/create-error';
import * as syncImpl from '../../../integrations/services/sync/implementation';
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
    throw createError('10007');
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
  logger.info('Importing users for network', { networkId });
  const internalUsers = await networkRepo.findAllUsersForNetwork(networkId);
  const newExternalUsers = differenceBy(externalUsers, internalUsers, 'username');
  const newUsers = await userRepo.createBulkUsers(
    map(newExternalUsers, (u) => ({ ...u, password: passwordUtil.plainRandom() })));
  const existingUsers = intersectionBy(internalUsers, externalUsers, 'username');
  const usersToAdd = [...newUsers, ...existingUsers];

  await Promise.map(usersToAdd, (internalUser) => {
    let externalUser;

    try {
      externalUser = findExternalUser(internalUser, externalUsers);

      // FIXME: This should adhere to our new external user domain object.
      // The isActive and isAdmin will be deprecated soon.
      return networkRepo.addUser({
        networkId,
        userId: internalUser.id,
        deletedAt: externalUser.isActive ? null : new Date(),
        externalId: externalUser.externalId,
        roleType: externalUser.isAdmin ? 'ADMIN' : 'EMPLOYEE',
      });
    } catch (err) {
      logger.error('Could not add user to network', { networkId, internalUser, externalUser });

      throw err;
    }
  });

  return usersToAdd;
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
export const importTeams = async (externalTeams, networkId) => {
  logger.info('Importing teams for network', { networkId });
  const existingTeams = await networkRepo.findTeamsForNetwork(networkId);
  const teamsToCreate = differenceBy(externalTeams, existingTeams, 'externalId');
  const teams = map(teamsToCreate, team => ({ ...team, networkId }));

  logger.info('Creating teams', {
    networkId,
    team_count: teams.length,
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
    let externalUserWithReplacedTeamIds;

    try {
      const externalUser = findExternalUser(internalUser, externalUsers);
      if (!externalUser) return;

      // Make sure we translate the team ids to our internal's and not by the external's
      // and filter out null values to avoid undefined errors while adding the user to a team.
      externalUserWithReplacedTeamIds = syncImpl.replaceExternalTeamIds(
        externalUser, internalUser, internalTeams);

      return Promise.map(externalUserWithReplacedTeamIds.teamIds, (teamId) => {
        return teamRepo.addUserToTeam(teamId, internalUser.id);
      });
    } catch (err) {
      logger.error('Error while adding using to the team', {
        internalUser, externalUser: externalUserWithReplacedTeamIds, internalTeams });

      throw err;
    }
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

export const importNetwork = async (network, username) => {
  try {
    let mailConfig;
    const adapter = createAdapter(network, [], { proceedWithoutToken: true });
    const externalUsers = await adapter.fetchUsers(network.externalId);
    const admin = await userRepo.findUserByUsername(username);
    const externalAdmin = find(externalUsers, (user) => {
      return user.username === username;
    });

    if (admin) {
      await updateSuperUserForNetwork(admin.id, network.id);
      await networkRepo.addUser({
        userId: admin.id,
        networkId: network.id,
        isActive: true,
        externalId: externalAdmin.externalId,
        roleType: 'ADMIN',
      });

      mailConfig = configurationMail(network, admin);
    } else {
      if (!externalAdmin) throw createError('10006');

      const password = passwordUtil.plainRandom();
      const superUser = await userRepo.createUser({ ...externalAdmin, password });
      await networkRepo.addUser({
        userId: superUser.id,
        networkId: network.id,
        isActive: true,
        externalId: externalAdmin.externalId,
        roleType: 'ADMIN',
      });

      await updateSuperUserForNetwork(superUser.id, network.id);
      mailConfig = configurationMailNewAdmin(network, superUser, password);
    }

    const importedTeams = await importTeams(await adapter.fetchTeams(), network.id);
    const importedUsers = await importUsers(externalUsers, network.id);

    await addUsersToTeam(importedUsers, importedTeams, externalUsers);
    await networkRepo.setImportDateOnNetworkIntegration(network.id);

    logger.info('Finished importing users for network', {
      networkId: network.id,
      addedTeams: importedTeams.length,
      addedUsers: importedUsers.length,
    });

    Mailer.send(mailConfig);
  } catch (err) {
    logger.error('Failed to import network', { err });
  }
};
