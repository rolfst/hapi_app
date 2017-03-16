const sinon = require('sinon');
const { assert } = require('chai');
const R = require('ramda');
const { find } = require('lodash');
const Promise = require('bluebird');
const testHelpers = require('../../../../shared/test-utils/helpers');
const adapterUtil = require('../../../../shared/utils/create-adapter');
const networkRepository = require('../../../core/repositories/network');
const teamRepository = require('../../../core/repositories/team');
const userRepository = require('../../../core/repositories/user');
const networkService = require('../../../core/services/network');
const service = require('./index');

describe('Network synchronisation', () => {
  let network;
  let admin;

  before(async () => {
    admin = await testHelpers.createUser();

    const networkWithIntegration = await testHelpers.createNetworkWithIntegration({
      userId: admin.id,
      externalId: 'pmtnetwork.api.flex-appeal.nl',
      name: 'network-PMT',
      integrationName: 'FOO_PARTNER',
      integrationToken: 'foo_token',
      userExternalId: admin.externalId,
      userToken: 'ad34e192f03c',
    });

    network = networkWithIntegration.network;

    await networkRepository.setImportDateOnNetworkIntegration(network.id);
  });

  after(() => testHelpers.cleanAll());

  describe('Teams synchronisation', () => {
    let sandbox;

    before(() => (sandbox = sinon.sandbox.create()));
    afterEach(async () => {
      sandbox.restore();
      // Delete all the teams so we have a network without any teams in every testcase
      const teamsForNetwork = await networkRepository.findTeamsForNetwork(network.id);

      return Promise.map(R.pluck('id', teamsForNetwork), teamRepository.deleteById);
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
      const pluckEmployeeIds = R.pipe(R.filter(R.propEq('roleType', 'EMPLOYEE')), R.pluck('id'));

      return Promise.map(pluckEmployeeIds(usersInNetwork), userRepository.deleteById);
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

      assert.lengthOf(activeUsersInNetwork, 3);
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

      assert.lengthOf(activeUsersInNetwork, 1);
      assert.lengthOf(allUsersInNetwork, 2);
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
      await userRepository.setNetworkLink({
        userId: createdUser.id,
        networkId: network.id,
      }, {
        userId: createdUser.id,
        networkId: network.id,
        deletedAt: new Date(),
        externalId: internalUser.externalId,
      });

      await service.syncNetwork({ networkId: network.id, internal: true });

      const activeUsersInNetwork = await networkService.listActiveUsersForNetwork({
        networkId: network.id }, { credentials: network.superAdmin });

      assert.lengthOf(activeUsersInNetwork, 2);
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
          externalId: userToTransfer.externalId,
        }),
        networkRepository.addUser({
          userId: createdUsers[1].id,
          networkId: network.id,
          deletedAt: null,
          externalId: initialUsers[1].externalId,
        }),
      ]);

      const newNetwork = await networkRepository.createIntegrationNetwork({
        userId: admin.id,
        externalId: 'api.transferednetwork.nl',
        name: 'Foo network for transfer',
        integrationName: 'FOO_PARTNER',
      });

      await testHelpers.addUserToNetwork({
        userId: admin.id, networkId: newNetwork.id, roleType: 'ADMIN' });

      await networkRepository.setImportDateOnNetworkIntegration(newNetwork.id);
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
        user => user.email === userToTransfer.email);

      assert.lengthOf(activeUsersInNetwork, 2);
      assert.lengthOf(activeUsersInNetworkAfterUpdate, 2);
      assert.lengthOf(activeUsersInToTransferNetwork, 3);
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
      const employeesOfNetwork = R.reject(R.propEq('id', network.superAdmin.id));
      const employeeIds = R.pluck('id', employeesOfNetwork(usersInNetwork));

      // We should delete the teams first to avoid a deadlock for at team_user pivot table
      await Promise.map(teamsForNetwork, team => teamRepository.deleteById(team.id));
      await Promise.map(employeeIds, userRepository.deleteById);
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
        deletedAt: null,
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
        deletedAt: null,
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
