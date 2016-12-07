import { assert } from 'chai';
import nock from 'nock';
import { map, reject, pick, differenceBy, drop, find } from 'lodash';
import Promise from 'bluebird';
import * as setup from '../../../../shared/test-utils/setup';
import * as blueprints from '../../../../shared/test-utils/blueprints';
import * as stubs from '../../../../shared/test-utils/stubs';
import * as passwordUtil from '../../../../shared/utils/password';
import userSerializer from '../../../../adapters/pmt/serializers/user';
import * as networkRepo from '../../../core/repositories/network';
import * as userRepo from '../../../core/repositories/user';
import * as teamRepo from '../../../core/repositories/team';
import * as integrationRepo from '../../../core/repositories/integration';
import * as syncService from './index';

describe('Sync Network Workflow', () => {
  nock.disableNetConnect();

  let network;
  let integration;
  let alreadyImportedAdmin;
  let alreadyImportedUser;
  let importedTeam;

  const pristineNetwork = stubs.pristine_networks_admins[0];
  const initialAdmin = pristineNetwork.admins[0];
  const initialEmployee = userSerializer(stubs.users_200.data[0]);
  const NEW_TEAM_EXTERNALID = '14';
  const EXISTING_TEAM_EXTERNALID = '28';
  const intialTeam = {
    externalId: EXISTING_TEAM_EXTERNALID,
    name: 'Vleesafdeling',
  };

  const createIntegration = () => integrationRepo.createIntegration({
    name: pristineNetwork.integrationName,
    token: 'footoken',
  });

  const createIntegrationNetwork = (user) => networkRepo.createIntegrationNetwork({
    ...pick(pristineNetwork, 'externalId', 'name', 'integrationName'),
    userId: user.id,
  });

  const adminCredentials = {
    username: blueprints.users.admin.username,
    password: blueprints.users.admin.password,
  };

  describe('Importing users', () => {
    before(async () => {
      await setup.finalCleanup();

      alreadyImportedAdmin = await userRepo.createUser({
        ...initialAdmin, password: passwordUtil.plainRandom() });
      alreadyImportedUser = await userRepo.createUser({
        ...initialEmployee, password: passwordUtil.plainRandom() });

      alreadyImportedAdmin.externalId = initialAdmin.userId;
      alreadyImportedUser.externalId = initialEmployee.externalId;

      integration = await createIntegration();
      network = await createIntegrationNetwork(alreadyImportedAdmin);
      importedTeam = await teamRepo.createTeam({
        networkId: network.id,
        name: intialTeam.name,
        externalId: intialTeam.externalId,
      });

      const usersToAdd = map([alreadyImportedAdmin, alreadyImportedUser], (user) => ({
        userId: user.id,
        networkId: network.id,
        isActive: true,
        externalId: user.externalId,
        roleType: 'ADMIN',
      }));

      const globalAdmin = await userRepo.createUser(blueprints.users.admin);

      usersToAdd.push({
        userId: globalAdmin.id,
        networkId: network.id,
        isActive: true,
        roleType: 'ADMIN',
        invisibleUser: true,
      });

      return Promise.map(usersToAdd, networkRepo.addUser);
    });

    after(async () => {
      await integrationRepo.deleteById(integration.id);
      await userRepo.deleteById(alreadyImportedUser.id);
      await userRepo.deleteById(alreadyImportedAdmin.id);

      return setup.initialSetup();
    });

    afterEach(async () => {
      nock.cleanAll();

      const allUsers = await networkRepo.findAllUsersForNetwork(network.id);
      const users = differenceBy(allUsers, [alreadyImportedUser, alreadyImportedAdmin], 'email');

      return Promise.map(map(users, 'id'), userRepo.deleteById);
    });

    it('should add new users', async () => {
      const initialUserCount = (await networkRepo.findAllUsersForNetwork(network.id)).length;

      nock(network.externalId)
        .post('/login', adminCredentials)
        .reply(200, { logged_in_user_token: '379ce9b4176cb89354c1f74b3a2c1c7a', user_id: 8023 });
      nock(network.externalId)
        .get('/users')
        .reply(200, stubs.users_200);
      nock(network.externalId)
        .get('/departments')
        .reply(200, stubs.departments);

      await syncService.syncWithIntegrationPartner({}, { credentials: alreadyImportedAdmin });
      const users = await networkRepo.findUsersForNetwork(network.id);
      const userCount = users.length;

      assert.isAbove(userCount, initialUserCount);
      assert.equal(userCount, 13);
    });

    it('should reactivate deleted users for network', async () => {
      const initialUserCount = (await networkRepo.findUsersForNetwork(network.id)).length;
      await userRepo.updateUserForNetwork(alreadyImportedUser, network.id, false);
      const userCountAfterInitalRemoval = (await networkRepo.findUsersForNetwork(network.id))
        .length;

      assert.isBelow(userCountAfterInitalRemoval, initialUserCount);

      nock(network.externalId)
        .post('/login', adminCredentials)
        .reply(200, { logged_in_user_token: '379ce9b4176cb89354c1f74b3a2c1c7a', user_id: 8023 });
      nock(network.externalId)
        .get('/users')
        .reply(200, stubs.users_200);
      nock(network.externalId)
        .get('/departments')
        .reply(200, stubs.departments);

      await syncService.syncWithIntegrationPartner({}, { credentials: alreadyImportedAdmin });

      const users = await networkRepo.findUsersForNetwork(network.id);
      const userCount = users.length;
      const networkInfoForRemovedUser = await userRepo.findUserMetaDataForNetwork(
        alreadyImportedUser.id, network.id);

      assert.isAbove(userCount, userCountAfterInitalRemoval);
      assert.isNull(networkInfoForRemovedUser.deletedAt);
    });

    it('should update the role of existing users', async () => {
      nock(network.externalId)
        .get('/users')
        .reply(200, stubs.users_200);
      nock(network.externalId)
        .get('/departments')
        .reply(200, stubs.departments);

      await syncService.syncWithIntegrationPartner({}, { credentials: alreadyImportedAdmin });

      const updatedUser = await userRepo.findUserMetaDataForNetwork(
        alreadyImportedUser.id, network.id);

      assert.equal(updatedUser.roleType, 'EMPLOYEE');
    });

    it('should remove users from a network that are no longer present in integration partner', async () => { // eslint-disable-line
      const listWithRemovedUser = { data: drop(stubs.users_200.data) };

      nock(network.externalId)
        .get('/users')
        .reply(200, listWithRemovedUser);
      nock(network.externalId)
        .get('/departments')
        .reply(200, stubs.departments);

      await syncService.syncWithIntegrationPartner({}, {
        credentials: alreadyImportedAdmin,
        artifacts: { requestId: 'removeuserstest' },
      });

      const users = await networkRepo.findUsersForNetwork(network.id);
      const userCount = users.length;
      const removedUser = await userRepo.findUserInNetworkByExternalId(
        network.id, stubs.users_200.data[0].id);
      const networkInfoForRemovedUser = await userRepo.findUserMetaDataForNetwork(
        removedUser.id, network.id);

      assert.equal(listWithRemovedUser.data.length, (stubs.users_200.data.length - 1));
      assert.equal(userCount, listWithRemovedUser.data.length);
      assert.isNotNull(networkInfoForRemovedUser.deletedAt);
    });
  });

  describe('importing teams', () => {
    before(async () => {
      await setup.finalCleanup();
      alreadyImportedAdmin = await userRepo.createUser({
        ...initialAdmin,
        password: passwordUtil.plainRandom(),
      });

      alreadyImportedUser = await userRepo.createUser({
        ...initialEmployee,
        password: passwordUtil.plainRandom(),
      });

      alreadyImportedAdmin.externalId = initialAdmin.userId;
      alreadyImportedUser.externalId = initialEmployee.externalId;
      integration = await createIntegration();
      network = await createIntegrationNetwork(alreadyImportedAdmin);

      const usersToAdd = [alreadyImportedAdmin, alreadyImportedUser];
      return Promise.map(usersToAdd, (user) => networkRepo.addUser({
        userId: user.id,
        networkId: network.id,
        isActive: true,
        externalId: user.externalId,
        roleType: 'ADMIN', // on purpose both admin on initial load
      }));
    });

    beforeEach(async() => {
      importedTeam = await teamRepo.createTeam({
        networkId: network.id,
        name: intialTeam.name,
        externalId: intialTeam.externalId,
      });
    });

    after(async () => {
      const teams = await networkRepo.findTeamsForNetwork(network.id);
      await Promise.each(teams, (team) => teamRepo.deleteById(team.id));
      await Promise.all([
        integrationRepo.deleteById(integration.id),
        userRepo.deleteById(alreadyImportedUser.id),
        userRepo.deleteById(alreadyImportedAdmin.id),
      ]);

      return setup.initialSetup();
    });

    afterEach(async () => {
      nock.cleanAll();

      const allUsers = await networkRepo.findAllUsersForNetwork(network.id);
      const users = differenceBy(allUsers, [alreadyImportedUser, alreadyImportedAdmin], 'email');
      const promises = map(users, (user) => userRepo.deleteById(user.id));

      promises.push(teamRepo.deleteById(importedTeam.id));

      return Promise.all(promises);
    });

    it('should add new teams that are not present in our system', async () => {
      nock(network.externalId)
        .post('/login', adminCredentials)
        .reply(200, { logged_in_user_token: '379ce9b4176cb89354c1f74b3a2c1c7a', user_id: 8023 });
      nock(network.externalId)
        .get('/departments')
        .reply(200, stubs.departments);
      nock(network.externalId)
        .get('/users')
        .reply(200, stubs.users_200);

      const initialTeamsCount = (await networkRepo.findTeamsForNetwork(network.id)).length;
      const message = {
        credentials: alreadyImportedAdmin,
        artifacts: { requestId: 'removeuserstest' },
      };

      await syncService.syncWithIntegrationPartner({}, message);
      const teamsCount = (await networkRepo.findTeamsForNetwork(network.id)).length;

      assert.isAbove(teamsCount, initialTeamsCount);
    });

    it('should remove teams that are no longer present in integration partner', async () => {
      const listWithRemovedTeams = { departments: reject(stubs.departments.departments,
        (team) => (team.department_id === EXISTING_TEAM_EXTERNALID)) };

      assert.equal(listWithRemovedTeams.departments.length, 12);

      nock(network.externalId)
        .post('/login', adminCredentials)
        .reply(200, { logged_in_user_token: '379ce9b4176cb89354c1f74b3a2c1c7a', user_id: 8023 });
      nock(network.externalId)
        .get('/users')
        .reply(200, stubs.users_200);
      nock(network.externalId)
        .get('/departments')
        .reply(200, listWithRemovedTeams);

      await Promise.all([
        teamRepo.addUserToTeam(importedTeam.id, alreadyImportedAdmin.id),
        teamRepo.addUserToTeam(importedTeam.id, alreadyImportedUser.id),
      ]);

      await syncService.syncWithIntegrationPartner({}, {
        credentials: alreadyImportedAdmin,
        artifacts: { requestId: 'removeteamstest' },
      });

      const removedTeamIdFromExternal = stubs.departments.departments[0].id;
      const listTeams = await networkRepo.findTeamsForNetwork(network.id);
      const foundDeletedTeamsCount = (await teamRepo.findTeamsByExternalId([
        removedTeamIdFromExternal])).length;

      assert.equal(listWithRemovedTeams.departments.length, listTeams.length);
      assert.equal(foundDeletedTeamsCount, 0);
    });

    it('should update existing team', async () => {
      nock(network.externalId)
        .post('/login', adminCredentials)
        .reply(200, { logged_in_user_token: '379ce9b4176cb89354c1f74b3a2c1c7a', user_id: 8023 });
      nock(network.externalId)
        .get('/users')
        .reply(200, stubs.users_200);
      nock(network.externalId)
        .get('/departments')
        .reply(200, stubs.departments);

      const team = await teamRepo.findTeamById(importedTeam.id);

      assert.equal(team.name, 'Vleesafdeling');

      await Promise.all([
        teamRepo.addUserToTeam(importedTeam.id, alreadyImportedAdmin.id),
        teamRepo.addUserToTeam(importedTeam.id, alreadyImportedUser.id),
      ]);

      await syncService.syncWithIntegrationPartner({}, {
        credentials: alreadyImportedAdmin,
        artifacts: { requestId: 'removeuserstest' },
      });

      const updatedTeam = await teamRepo.findTeamById(importedTeam.id);
      assert.equal(updatedTeam.name, 'Algemeen');
    });

    it('should add existing user to new team', async () => {
      nock(network.externalId)
        .post('/login', adminCredentials)
        .reply(200, { logged_in_user_token: '379ce9b4176cb89354c1f74b3a2c1c7a', user_id: 8023 });
      nock(network.externalId)
        .get('/users')
        .reply(200, stubs.users_200);
      nock(network.externalId)
        .get('/departments')
        .reply(200, stubs.departments);

      await Promise.all([
        teamRepo.addUserToTeam(importedTeam.id, alreadyImportedAdmin.id),
        teamRepo.addUserToTeam(importedTeam.id, alreadyImportedUser.id),
      ]);

      await syncService.syncWithIntegrationPartner({}, {
        credentials: alreadyImportedAdmin,
        artifacts: { requestId: 'removeuserstest' },
      });

      const team = await teamRepo.findBy({ externalId: NEW_TEAM_EXTERNALID });
      const users = await teamRepo.findMembers(team.id);

      assert.isOk(find(users, { id: alreadyImportedUser.id }));
    });

    it('should add new users to new team', async () => {
      nock(network.externalId)
        .post('/login', adminCredentials)
        .reply(200, { logged_in_user_token: '379ce9b4176cb89354c1f74b3a2c1c7a', user_id: 8023 });
      nock(network.externalId)
        .get('/users')
        .reply(200, stubs.users_200);
      nock(network.externalId)
        .get('/departments')
        .reply(200, stubs.departments);

      await Promise.all([
        teamRepo.addUserToTeam(importedTeam.id, alreadyImportedAdmin.id),
        teamRepo.addUserToTeam(importedTeam.id, alreadyImportedUser.id),
      ]);

      await syncService.syncWithIntegrationPartner({}, {
        credentials: alreadyImportedAdmin,
        artifacts: { requestId: 'removeuserstest' },
      });

      const team = await teamRepo.findBy({ externalId: NEW_TEAM_EXTERNALID });
      const users = await teamRepo.findMembers(team.id);

      assert.isAbove(users.length, 1);
    });

    it('should add new users to existing team', async () => {
      nock(network.externalId)
        .post('/login', adminCredentials)
        .reply(200, { logged_in_user_token: '379ce9b4176cb89354c1f74b3a2c1c7a', user_id: 8023 });
      nock(network.externalId)
        .get('/users')
        .reply(200, stubs.users_200);
      nock(network.externalId)
        .get('/departments')
        .reply(200, stubs.departments);

      await Promise.all([
        teamRepo.addUserToTeam(importedTeam.id, alreadyImportedAdmin.id),
        teamRepo.addUserToTeam(importedTeam.id, alreadyImportedUser.id),
      ]);

      await syncService.syncWithIntegrationPartner({}, {
        credentials: alreadyImportedAdmin,
        artifacts: { requestId: 'removeuserstest' },
      });

      const team = await teamRepo.findBy({ externalId: NEW_TEAM_EXTERNALID });
      const users = await teamRepo.findMembers(team.id);

      assert.isAbove(users.length, 1);
    });
  });
});
