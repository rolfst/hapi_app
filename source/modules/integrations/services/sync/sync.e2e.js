import sinon from 'sinon';
import { assert } from 'chai';
import { map, find } from 'lodash';
import Promise from 'bluebird';
import * as adapterUtil from '../../../../shared/utils/create-adapter';
import * as integrationRepository from '../../../core/repositories/integration';
import * as networkRepository from '../../../core/repositories/network';
import * as teamRepository from '../../../core/repositories/team';
import * as userRepository from '../../../core/repositories/user';
import * as networkService from '../../../core/services/network';
import * as serviceImpl from './implementation';
import * as service from './index';

describe('Network synchronisation', () => {
  let network;

  before(async () => {
    await integrationRepository.createIntegration({
      name: 'FOO_PARTNER',
      token: 'foo_token',
    });

    network = await networkRepository.createIntegrationNetwork({
      userId: global.users.admin.id,
      externalId: 'api.coolintegration.nl',
      name: 'Network with integration',
      integrationName: 'FOO_PARTNER',
    });
  });

  after(async () => {
    const users = await networkRepository.findUsersForNetwork(network.id);
    const promises = map(users, user => userRepository.deleteById(user.id));

    return Promise.all(promises);
  });

  describe('Teams synchronisation', () => {
    let sandbox;

    before(() => (sandbox = sinon.sandbox.create()));
    afterEach(async () => {
      sandbox.restore();
      // Delete all the teams so we have a network without any teams in every testcase
      const teamsForNetwork = await networkRepository.findTeamsForNetwork(network.id);

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

      const internalTeams = [{
        networkId: network.id,
        externalId: '2',
        name: 'Kassa',
        description: null,
      }];

      sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve({
        fetchUsers: () => Promise.resolve([]),
        fetchTeams: () => Promise.resolve(externalTeams),
      }));

      await teamRepository.create(internalTeams[0]);
      await service.syncNetwork({ networkId: network.id, internal: true });
      const teamsForNetwork = await networkRepository.findTeamsForNetwork(network.id);
      const syncedTeam = find(teamsForNetwork, { externalId: '1' });

      assert.lengthOf(teamsForNetwork, 2);
      assert.isDefined(syncedTeam);
      assert.equal(syncedTeam.name, 'Vulploeg');
    });

    it('should remove teams from network', async () => {
      const externalTeams = [];

      const internalTeams = [{
        networkId: network.id,
        externalId: '2',
        name: 'Kassa',
        description: null,
      }];

      sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve({
        fetchUsers: () => Promise.resolve([]),
        fetchTeams: () => Promise.resolve(externalTeams),
      }));

      await teamRepository.create(internalTeams[0]);
      await service.syncNetwork({ networkId: network.id, internal: true });
      const teamsForNetwork = await networkRepository.findTeamsForNetwork(network.id);

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

      const internalTeams = [{
        networkId: network.id,
        externalId: '2',
        name: 'Kassa',
        description: null,
      }];

      sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve({
        fetchUsers: () => Promise.resolve([]),
        fetchTeams: () => Promise.resolve(externalTeams),
      }));

      await teamRepository.create(internalTeams[0]);
      await service.syncNetwork({ networkId: network.id, internal: true });
      const teamsForNetwork = await networkRepository.findTeamsForNetwork(network.id);
      const changedTeam = find(teamsForNetwork, { externalId: '2' });

      assert.lengthOf(teamsForNetwork, 1);
      assert.isDefined(changedTeam);
      assert.equal(changedTeam.name, 'Kassa Oud');
    });

    it('should only sync teams with defined externalId', async () => {
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

      const internalTeams = [{
        networkId: network.id,
        externalId: '2',
        name: 'Kassa',
        description: null,
      }, {
        networkId: network.id,
        externalId: null,
        name: 'Non syncing team',
        description: null,
      }];

      sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve({
        fetchUsers: () => Promise.resolve([]),
        fetchTeams: () => Promise.resolve(externalTeams),
      }));

      await Promise.map(internalTeams, teamRepository.create);
      await service.syncNetwork({ networkId: network.id, internal: true });
      const teamsForNetwork = await networkRepository.findTeamsForNetwork(network.id);
      const syncedTeam = find(teamsForNetwork, { externalId: '1' });

      assert.lengthOf(teamsForNetwork, 3);
      assert.isDefined(syncedTeam);
      assert.equal(syncedTeam.name, 'Vulploeg');
    });
  });

  describe('Users synchronisation with network link', () => {
    let sandbox;

    before(() => (sandbox = sinon.sandbox.create()));

    afterEach(async () => {
      sandbox.restore();
      // Delete all the users so we have a network without any users in every testcase
      const usersInNetwork = await networkRepository.findAllUsersForNetwork(network.id);

      return Promise.map(map(usersInNetwork, 'id'), userRepository.deleteById);
    });

    it('should add users to network', async () => {
      const externalUsers = [{
        externalId: '1',
        email: 'bazfoo@hodor.nl',
        firstName: 'Baz',
        lastName: 'Foo',
        roleType: 'EMPLOYEE',
        deletedAt: null,
        teamIds: [],
      }, {
        externalId: '2',
        email: 'johndoe@hodor.nl',
        firstName: 'John',
        lastName: 'Doe',
        roleType: 'EMPLOYEE',
        deletedAt: null,
        teamIds: [],
      }];

      const internalUsers = [{
        externalId: '2',
        username: 'johndoe@hodor.nl',
        email: 'johndoe@hodor.nl',
        firstName: 'John',
        lastName: 'Doe',
        password: 'foo',
        deletedAt: null,
      }];

      sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve({
        fetchUsers: () => Promise.resolve(externalUsers),
        fetchTeams: () => Promise.resolve([]),
      }));

      const createdUser = await userRepository.createUser(internalUsers[0]);
      await networkRepository.addUser({
        userId: createdUser.id,
        networkId: network.id,
        externalId: internalUsers[0].externalId,
        deletedAt: null,
      });

      await service.syncNetwork({ networkId: network.id, internal: true });

      const activeUsersInNetwork = await networkService.listActiveUsersForNetwork({
        networkId: network.id }, { credentials: network.superAdmin });
      const syncedUser = find(activeUsersInNetwork, { externalId: '1' });

      assert.lengthOf(activeUsersInNetwork, 2);
      assert.isDefined(syncedUser);
      assert.equal(syncedUser.email, externalUsers[0].email);
      assert.equal(syncedUser.username, externalUsers[0].email);
      assert.equal(syncedUser.firstName, externalUsers[0].firstName);
      assert.equal(syncedUser.lastName, externalUsers[0].lastName);
      assert.equal(syncedUser.roleType, externalUsers[0].roleType);
    });

    it('should remove users from network', async () => {
      const externalUsers = [{
        externalId: '2',
        username: 'johndoe@hodor.nl',
        email: 'johndoe@hodor.nl',
        firstName: 'John',
        lastName: 'Doe',
        roleType: 'EMPLOYEE',
        isActive: false,
        deletedAt: new Date(),
        teamIds: [],
      }];

      const internalUsers = [{
        externalId: '2',
        username: 'johndoe@hodor.nl',
        email: 'johndoe@hodor.nl',
        firstName: 'John',
        lastName: 'Doe',
        password: 'foo',
      }];

      sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve({
        fetchUsers: () => Promise.resolve(externalUsers),
        fetchTeams: () => Promise.resolve([]),
      }));

      const createdUser = await userRepository.createUser(internalUsers[0]);
      await networkRepository.addUser({
        userId: createdUser.id,
        networkId: network.id,
        externalId: internalUsers[0].externalId,
      });

      await service.syncNetwork({ networkId: network.id, internal: true });

      const activeUsersInNetwork = await networkService.listActiveUsersForNetwork({
        networkId: network.id }, { credentials: network.superAdmin });
      const allUsersInNetwork = await networkService.listAllUsersForNetwork({
        networkId: network.id }, { credentials: network.superAdmin });

      assert.lengthOf(activeUsersInNetwork, 0);
      assert.lengthOf(allUsersInNetwork, 1);
    });

    it('should add users that were previously deleted from network', async () => {
      const externalUsers = [{
        externalId: '2',
        username: 'johndoe@hodor.nl',
        email: 'johndoe@hodor.nl',
        firstName: 'John',
        lastName: 'Doe',
        roleType: 'EMPLOYEE',
        deletedAt: null,
        teamIds: [],
      }];

      const internalUser = {
        externalId: '2',
        username: 'johndoe@hodor.nl',
        email: 'johndoe@hodor.nl',
        firstName: 'John',
        lastName: 'Doe',
        password: 'foo',
      };

      sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve({
        fetchUsers: () => Promise.resolve(externalUsers),
        fetchTeams: () => Promise.resolve([]),
      }));

      const createdUser = await userRepository.createUser(internalUser);
      await userRepository.createNetworkLink({
        userId: createdUser.id,
        networkId: network.id,
        deletedAt: new Date(),
        externalId: internalUser.externalId,
      });

      await service.syncNetwork({ networkId: network.id, internal: true });

      const activeUsersInNetwork = await networkService.listActiveUsersForNetwork({
        networkId: network.id }, { credentials: network.superAdmin });

      assert.lengthOf(activeUsersInNetwork, 1);
    });

    it('should transfer user from one network to another', async () => {
      const externalUsers = [{
        externalId: '1',
        username: 'johndoe@hodor.nl',
        email: 'johndoe@hodor.nl',
        firstName: 'John',
        lastName: 'Doe',
        roleType: 'EMPLOYEE',
        isActive: true,
        deletedAt: null,
        teamIds: [],
      }, {
        externalId: '3',
        username: 'bonzo@flex-appeal.nl',
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
        username: 'johndoe@hodor.nl',
        email: 'johndoe@hodor.nl',
        firstname: 'john',
        lastname: 'doe',
        password: 'foo',
      };

      const initialUsers = [userToTransfer, {
        externalId: '2',
        username: 'alwin@flex-appeal.nl',
        email: 'alwin@flex-appeal.nl',
        firstname: 'al',
        lastname: 'win',
        password: 'baz',
      }];

      sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve({
        fetchUsers: () => Promise.resolve(externalUsers),
        fetchTeams: () => Promise.resolve([]),
      }));

      const createdUsers = await userRepository.createBulkUsers(initialUsers);
      await Promise.all([
        networkRepository.addUser({
          userId: createdUsers[0].id,
          networkId: network.id,
          deletedAt: new Date(),
          externalId: initialUsers[0].externalId,
        }),
        networkRepository.addUser({
          userId: createdUsers[1].id,
          networkId: network.id,
          deletedAt: null,
          externalId: initialUsers[1].externalId,
        }),
      ]);

      const newNetwork = await networkRepository
        .createNetwork(global.users.admin.id, 'Foo network for transfer');
      const activeUsersInNetwork = await networkService.listActiveUsersForNetwork({
        networkId: network.id }, { credentials: network.superAdmin });

      await service.syncNetwork({ networkId: newNetwork.id, internal: true });

      const [activeUsersInNetworkAfterUpdate, activeUsersInToTransferNetwork] = await Promise.all([
        networkService.listActiveUsersForNetwork({
          networkId: network.id }, { credentials: network.superAdmin }),
        networkService.listActiveUsersForNetwork({
          networkId: newNetwork.id }, { credentials: network.superAdmin }),
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
    let sandbox;

    before(() => (sandbox = sinon.sandbox.create()));

    afterEach(async () => {
      sandbox.restore();
      // Delete all the teams and users so we have a fresh network in every testcase
      const teamsForNetwork = await networkRepository.findTeamsForNetwork(network.id);
      const usersInNetwork = await networkRepository.findAllUsersForNetwork(network.id);

      // We should delete the teams first to avoid a deadlock for at team_user pivot table
      await Promise.map(teamsForNetwork, team => teamRepository.deleteById(team.id));
      await Promise.map(usersInNetwork, user => userRepository.deleteById(user.id));
    });

    it('should add users to team', async () => {
      const externalUsers = [{
        externalId: '2',
        username: 'johndoe',
        email: 'johndoe@hodor.nl',
        firstName: 'John',
        lastName: 'Doe',
        roleType: 'EMPLOYEE',
        isActive: true,
        deletedAt: null,
        teamIds: ['1', '2'], // These ids are equal to the internal team's externalId value
      }];

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

      const internalTeams = [{
        networkId: network.id,
        externalId: '1',
        name: 'Vulploeg',
        description: null,
      }, {
        networkId: network.id,
        externalId: '2',
        name: 'Kassa',
        description: null,
      }];

      const internalUser = {
        externalId: '2',
        username: 'johndoe',
        email: 'johndoe@hodor.nl',
        firstName: 'John',
        lastName: 'Doe',
        password: 'foo',
      };

      sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve({
        fetchUsers: () => Promise.resolve(externalUsers),
        fetchTeams: () => Promise.resolve(externalTeams),
      }));

      const createdTeams = await Promise.map(internalTeams, teamRepository.create);
      const createdUser = await userRepository.createUser(internalUser);
      await teamRepository.addUserToTeam(createdTeams[0].id, createdUser.id);
      await networkRepository.addUser({
        userId: createdUser.id,
        networkId: network.id,
        deletedAt: new Date(),
        externalId: internalUser.externalId,
      });

      await service.syncNetwork({ networkId: network.id, internal: true });

      const membersOfCreatedTeams = await Promise.map(createdTeams,
        team => teamRepository.findMembers(team.id));

      assert.lengthOf(membersOfCreatedTeams[0], 1);
      assert.lengthOf(membersOfCreatedTeams[1], 1);
    });

    it('should remove users from team', async () => {
      const externalUsers = [{
        externalId: '2',
        username: 'removed@hodor.nl',
        email: 'removed@hodor.nl',
        firstName: 'John',
        lastName: 'Doe',
        roleType: 'EMPLOYEE',
        isActive: true,
        deletedAt: new Date(),
        teamIds: ['2'], // These ids are equal to the internal team's externalId value
      }];

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

      const internalTeams = [{
        networkId: network.id,
        externalId: '1',
        name: 'Vulploeg',
        description: null,
      }, {
        networkId: network.id,
        externalId: '2',
        name: 'Kassa',
        description: null,
      }];

      const internalUser = {
        externalId: '2',
        username: 'removed@hodor.nl',
        email: 'removed@hodor.nl',
        firstName: 'John',
        lastName: 'Doe',
        password: 'foo',
      };

      sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve({
        fetchUsers: () => Promise.resolve(externalUsers),
        fetchTeams: () => Promise.resolve(externalTeams),
      }));

      const createdTeams = await Promise.map(internalTeams, teamRepository.create);
      const createdUser = await userRepository.createUser(internalUser);
      await networkRepository.addUser({
        userId: createdUser.id,
        networkId: network.id,
        deletedAt: new Date(),
        externalId: internalUser.externalId,
      });

      await teamRepository.addUserToTeam(createdTeams[0].id, createdUser.id);

      await service.syncNetwork({ networkId: network.id, internal: true });

      const membersOfCreatedTeams = await Promise.map(createdTeams,
        team => teamRepository.findMembers(team.id));

      assert.lengthOf(membersOfCreatedTeams[0], 0);
      assert.lengthOf(membersOfCreatedTeams[1], 1);
    });
  });
});
