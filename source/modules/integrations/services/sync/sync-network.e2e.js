import { assert } from 'chai';
import { map, find } from 'lodash';
import Promise from 'bluebird';
import * as testHelper from '../../../../shared/test-utils/helpers';
import * as networkRepository from '../../../core/repositories/network';
import * as teamRepository from '../../../core/repositories/team';
import * as userRepository from '../../../core/repositories/user';
import * as networkService from '../../../core/services/network';
import * as serviceImpl from './implementation';

describe('Network synchronisation', () => {
  let integratedNetwork;
  let admin;

  before(async () => {
    admin = await testHelper.createUser({ password: 'pw' });
    integratedNetwork = await networkRepository
    .createNetwork(admin.id, 'Foo network for sync')
  });

  after(async () => testHelper.cleanAll());

  describe('Teams synchronisation', () => {
    afterEach(async () => {
      // Delete all the teams so we have a network without any teams in every testcase
      const teamsForNetwork = await networkRepository.findTeamsForNetwork(integratedNetwork.id);

      return Promise.map(map(teamsForNetwork, 'id'), teamRepository.deleteById);
    });

    it('should add teams to network', async () => {
      const externalTeams = [{
        id: null,
        networkId: null,
        externalId: '1',
        name: 'Vulploeg',
        description: null,
      }, {
        id: null,
        networkId: null,
        externalId: '2',
        name: 'Kassa',
        description: null,
      }];

      const internalTeam = {
        networkId: integratedNetwork.id,
        externalId: '2',
        name: 'Kassa',
        description: null,
      };

      await teamRepository.create(internalTeam);
      await serviceImpl.syncTeams(integratedNetwork.id, externalTeams);
      const teamsForNetwork = await networkRepository.findTeamsForNetwork(integratedNetwork.id);
      const syncedTeam = find(teamsForNetwork, { externalId: '1' });

      assert.lengthOf(teamsForNetwork, 2);
      assert.isDefined(syncedTeam);
      assert.equal(syncedTeam.name, 'Vulploeg');
    });

    it('should remove teams from network', async () => {
      const externalTeams = [];

      const internalTeam = {
        networkId: integratedNetwork.id,
        externalId: '2',
        name: 'Kassa',
        description: null,
      };

      await teamRepository.create(internalTeam);
      await serviceImpl.syncTeams(integratedNetwork.id, externalTeams);
      const teamsForNetwork = await networkRepository.findTeamsForNetwork(integratedNetwork.id);

      assert.lengthOf(teamsForNetwork, 0);
    });

    it('should update teams in network', async () => {
      const externalTeams = [{
        id: null,
        networkId: null,
        externalId: '2',
        name: 'Kassa Oud',
        description: null,
      }];

      const internalTeam = {
        networkId: integratedNetwork.id,
        externalId: '2',
        name: 'Kassa',
        description: null,
      };

      await teamRepository.create(internalTeam);
      await serviceImpl.syncTeams(integratedNetwork.id, externalTeams);
      const teamsForNetwork = await networkRepository.findTeamsForNetwork(integratedNetwork.id);
      const changedTeam = find(teamsForNetwork, { externalId: '2' });

      assert.lengthOf(teamsForNetwork, 1);
      assert.isDefined(changedTeam);
      assert.equal(changedTeam.name, 'Kassa Oud');
    });
  });

  describe('Users synchronisation with network link', () => {
    afterEach(async () => {
      // Delete all the users so we have a network without any users in every testcase
      const usersInNetwork = await networkRepository.findAllUsersForNetwork(integratedNetwork.id);

      return Promise.map(map(usersInNetwork, 'id'), userRepository.deleteById);
    });

    it('should add users to network', async () => {
      const externalUsers = [{
        externalId: '1',
        username: 'bazfoo',
        email: 'bazfoo@flex-appeal.nl',
        firstName: 'Baz',
        lastName: 'Foo',
        roleType: 'EMPLOYEE',
        isActive: true,
        deletedAt: null,
        teamIds: [],
      }, {
        externalId: '2',
        username: 'johndoe',
        email: 'johndoe@flex-appeal.nl',
        firstName: 'John',
        lastName: 'Doe',
        roleType: 'EMPLOYEE',
        isActive: true,
        deletedAt: null,
        teamIds: [],
      }];

      const internalUser = {
        externalId: '2',
        username: 'johndoe',
        email: 'johndoe@flex-appeal.nl',
        firstName: 'John',
        lastName: 'Doe',
        password: 'foo',
      };

      const createdUser = await userRepository.createUser(internalUser);
      await networkRepository.addUser({
        userId: createdUser.id,
        networkId: integratedNetwork.id,
        externalId: internalUser.externalId,
      });

      const allUsersInSystem = await userRepository.findAllUsers();

      await serviceImpl.syncUsersWithNetwork(integratedNetwork.id, externalUsers, allUsersInSystem);
      const activeUsersInNetwork = await networkService.listActiveUsersForNetwork({
        networkId: integratedNetwork.id }, { credentials: integratedNetwork.superAdmin });
      const syncedUser = find(activeUsersInNetwork, { externalId: '1' });

      assert.lengthOf(activeUsersInNetwork, 2);
      assert.isDefined(syncedUser);
      assert.equal(syncedUser.email, externalUsers[0].email);
      assert.equal(syncedUser.username, externalUsers[0].username);
      assert.equal(syncedUser.firstName, externalUsers[0].firstName);
      assert.equal(syncedUser.lastName, externalUsers[0].lastName);
      assert.equal(syncedUser.roleType, externalUsers[0].roleType);
    });

    it('should remove users from network', async () => {
      const externalUsers = [{
        externalId: '1',
        username: 'johndoe',
        email: 'johndoe@flex-appeal.nl',
        firstName: 'John',
        lastName: 'Doe',
        roleType: 'EMPLOYEE',
        isActive: false,
        deletedAt: new Date(),
        teamIds: [],
      }];

      const internalUser = {
        externalId: '2',
        username: 'johndoe',
        email: 'johndoe@flex-appeal.nl',
        firstName: 'John',
        lastName: 'Doe',
        password: 'foo',
      };

      const createdUser = await userRepository.createUser(internalUser);
      await networkRepository.addUser({
        userId: createdUser.id,
        networkId: integratedNetwork.id,
        externalId: internalUser.externalId,
      });

      const allUsersInSystem = await userRepository.findAllUsers();
      await serviceImpl.syncUsersWithNetwork(integratedNetwork.id, externalUsers, allUsersInSystem);
      const activeUsersInNetwork = await networkService.listActiveUsersForNetwork({
        networkId: integratedNetwork.id }, { credentials: integratedNetwork.superAdmin });
      const allUsersInNetwork = await networkService.listAllUsersForNetwork({
        networkId: integratedNetwork.id }, { credentials: integratedNetwork.superAdmin });

      assert.lengthOf(activeUsersInNetwork, 0);
      assert.lengthOf(allUsersInNetwork, 1);
    });

    it('should add users that were previously deleted from network', async () => {
      const externalUsers = [{
        externalId: '2',
        username: 'johndoe',
        email: 'johndoe@flex-appeal.nl',
        firstName: 'John',
        lastName: 'Doe',
        roleType: 'EMPLOYEE',
        isActive: true,
        deletedAt: null,
        teamIds: [],
      }];

      const internalUser = {
        externalId: '2',
        username: 'johndoe',
        email: 'johndoe@flex-appeal.nl',
        firstName: 'John',
        lastName: 'Doe',
        password: 'foo',
      };

      const createdUser = await userRepository.createUser(internalUser);
      await networkRepository.addUser({
        userId: createdUser.id,
        networkId: integratedNetwork.id,
        deletedAt: new Date(),
        externalId: internalUser.externalId,
      });

      const allUsersInSystem = await userRepository.findAllUsers();
      await serviceImpl.syncUsersWithNetwork(integratedNetwork.id, externalUsers, allUsersInSystem);
      const activeUsersInNetwork = await networkService.listActiveUsersForNetwork({
        networkId: integratedNetwork.id }, { credentials: integratedNetwork.superAdmin });

      assert.lengthOf(activeUsersInNetwork, 1);
    });

    it('should transfer user from one network to another', async () => {
      const externalUsers = [{
        externalId: '1',
        username: 'johndoe',
        email: 'johndoe@flex-appeal.nl',
        firstName: 'John',
        lastName: 'Doe',
        roleType: 'EMPLOYEE',
        isActive: true,
        deletedAt: null,
        teamIds: [],
      }, {
        externalId: '3',
        username: 'bonzo',
        email: 'bonzo@flex-appeal.nl',
        firstname: 'bon',
        lastname: 'zo',
        password: 'foobar',
        roleType: 'EMPLOYEE',
        isActive: true,
        deletedAt: null,
        teamIds: [],
      }];

      const userToTransfer = {
        externalId: '1',
        username: 'johndoe',
        email: 'johndoe@flex-appeal.nl',
        firstname: 'john',
        lastname: 'doe',
        password: 'foo',
      };

      const initialUsers = [userToTransfer, {
        externalId: '2',
        username: 'alwin',
        email: 'alwin@flex-appeal.nl',
        firstname: 'al',
        lastname: 'win',
        password: 'baz',
      }];

      const createdUsers = await userRepository.createBulkUsers(initialUsers);
      await Promise.all([
        networkRepository.addUser({
          userId: createdUsers[0].id,
          networkId: integratedNetwork.id,
          deletedAt: new Date(),
          externalId: initialUsers[0].externalId,
        }),
        networkRepository.addUser({
          userId: createdUsers[1].id,
          networkId: integratedNetwork.id,
          deletedAt: null,
          externalId: initialUsers[1].externalId,
        }),
      ]);

      const newNetwork = await networkRepository
        .createNetwork(admin.id, 'Foo network for transfer');
      const activeUsersInNetwork = await networkService.listActiveUsersForNetwork({
        networkId: integratedNetwork.id }, { credentials: integratedNetwork.superAdmin });
      const allUsers = await userRepository.findAllUsers();

      await serviceImpl.syncUsersWithNetwork(newNetwork.id, externalUsers, allUsers);

      const [activeUsersInNetworkAfterUpdate, activeUsersInToTransferNetwork] = await Promise.all([
        networkService.listActiveUsersForNetwork({
          networkId: integratedNetwork.id }, { credentials: integratedNetwork.superAdmin }),
        networkService.listActiveUsersForNetwork({
          networkId: newNetwork.id }, { credentials: integratedNetwork.superAdmin }),
      ]);

      const transferedUser = find(activeUsersInToTransferNetwork,
        user => user.email === initialUsers[0].email);

      assert.lengthOf(activeUsersInNetwork, 1);
      assert.lengthOf(activeUsersInNetworkAfterUpdate, 1);
      assert.lengthOf(activeUsersInToTransferNetwork, 2);
      assert.isDefined(transferedUser);
    });
  });

  describe('Users synchronisation with team link', () => {
    afterEach(async () => {
      // Delete all the teams and users so we have a fresh network in every testcase
      const teamsForNetwork = await networkRepository.findTeamsForNetwork(integratedNetwork.id);
      const usersInNetwork = await networkRepository.findAllUsersForNetwork(integratedNetwork.id);

      // We should delete the teams first to avoid a deadlock for at team_user pivot table
      await Promise.map(teamsForNetwork, team => teamRepository.deleteById(team.id));
      await Promise.map(usersInNetwork, user => userRepository.deleteById(user.id));
    });

    it('should add users to team', async () => {
      const externalUsers = [{
        externalId: '2',
        username: 'johndoe',
        email: 'johndoe@flex-appeal.nl',
        firstName: 'John',
        lastName: 'Doe',
        roleType: 'EMPLOYEE',
        isActive: true,
        deletedAt: null,
        teamIds: ['1', '2'], // These ids are equal to the internal team's externalId value
      }];

      const internalTeams = [{
        networkId: integratedNetwork.id,
        externalId: '1',
        name: 'Vulploeg',
        description: null,
      }, {
        networkId: integratedNetwork.id,
        externalId: '2',
        name: 'Kassa',
        description: null,
      }];

      const internalUser = {
        externalId: '2',
        username: 'johndoe',
        email: 'johndoe@flex-appeal.nl',
        firstName: 'John',
        lastName: 'Doe',
        password: 'foo',
      };

      const createdTeams = await Promise.map(internalTeams, teamRepository.create);
      const createdUser = await userRepository.createUser(internalUser);
      await teamRepository.addUserToTeam(createdTeams[0].id, createdUser.id);
      await networkRepository.addUser({
        userId: createdUser.id,
        networkId: integratedNetwork.id,
        deletedAt: new Date(),
        externalId: internalUser.externalId,
      });

      await serviceImpl.syncUsersWithTeams(integratedNetwork.id, externalUsers);
      const membersOfCreatedTeams = await Promise.map(createdTeams,
        team => teamRepository.findMembers(team.id));

      assert.lengthOf(membersOfCreatedTeams[0], 1);
      assert.lengthOf(membersOfCreatedTeams[1], 1);
    });

    it.skip('should remove users from team', async () => {
      const externalUsers = [{
        externalId: '2',
        username: 'johndoe',
        email: 'johndoe@flex-appeal.nl',
        firstName: 'John',
        lastName: 'Doe',
        roleType: 'EMPLOYEE',
        isActive: true,
        deletedAt: null,
        teamIds: ['2'], // These ids are equal to the internal team's externalId value
      }];

      const internalTeams = [{
        networkId: integratedNetwork.id,
        externalId: '1',
        name: 'Vulploeg',
        description: null,
      }, {
        networkId: integratedNetwork.id,
        externalId: '2',
        name: 'Kassa',
        description: null,
      }];

      const internalUser = {
        externalId: '2',
        username: 'johndoe',
        email: 'johndoe@flex-appeal.nl',
        firstName: 'John',
        lastName: 'Doe',
        password: 'foo',
      };

      const createdTeams = await Promise.map(internalTeams, teamRepository.create);
      const createdUser = await userRepository.createUser(internalUser);
      await networkRepository.addUser({
        userId: createdUser.id,
        networkId: integratedNetwork.id,
        deletedAt: new Date(),
        externalId: internalUser.externalId,
      });
      await teamRepository.addUserToTeam(createdTeams[0].id, createdUser.id);

      const us = await userRepository.findUserById(createdUser.id, integratedNetwork.id);
      const count = await teamRepository.findMembers(createdTeams[0].id);
      console.log('+++++++++++++++++++', us)
      assert.lengthOf(count, 1);
      await serviceImpl.syncUsersWithTeams(integratedNetwork.id, externalUsers);
      const membersOfCreatedTeams = await Promise.map(createdTeams,
        team => teamRepository.findMembers(team.id));

      const m = await teamRepository.findMembers(createdTeams[0].id);
      assert.lengthOf(membersOfCreatedTeams[0], 0);
      assert.lengthOf(membersOfCreatedTeams[1], 1);
    });
  });
});
