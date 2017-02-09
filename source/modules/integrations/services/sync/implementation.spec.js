import { assert } from 'chai';
import sinon from 'sinon';
import * as impl from './implementation';
import * as teamRepository from '../../../core/repositories/team';
import * as userRepository from '../../../core/repositories/user';
import * as networkRepository from '../../../core/repositories/network';

describe('Service: Sync Implementation', () => {
  const internalTeams = [{
    id: '1',
    externalId: '240',
    name: 'Hodor',
  }, {
    id: '2',
    externalId: '234',
    name: 'Vulploeg',
  }, {
    id: '3',
    externalId: '232',
    name: 'Team to delete', // Should be deleted
  }];

  const externalTeams = [{
    externalId: '240',
    name: 'Hodor', // Should left unchanged
  }, {
    externalId: '234',
    name: 'Vulploeg twee', // Should be updated
  }, {
    externalId: '235',
    name: 'New team', // Should be added
  }];

  describe('createTeamActions', () => {
    it('should set correct teams to be added', () => {
      const teamActions = impl.createTeamActions(internalTeams, externalTeams);

      assert.deepEqual(teamActions.add, ['235']);
    });

    it('should set correct teams to be updated', () => {
      const teamActions = impl.createTeamActions(internalTeams, externalTeams);

      assert.deepEqual(teamActions.update, ['240', '234']);
    });

    it('should set correct teams to be deleted', () => {
      const teamActions = impl.createTeamActions(internalTeams, externalTeams);

      assert.deepEqual(teamActions.delete, ['232']);
    });

    it('should set correct teams lookup grouped by externalId ' +
       'by overwriting internal values if the model is present on both sides', () => {
      const teamActions = impl.createTeamActions(internalTeams, externalTeams);

      assert.deepEqual(teamActions.data, {
        240: {
          externalId: '240',
          name: 'Hodor',
        },
        232: {
          id: '3',
          externalId: '232',
          name: 'Team to delete',
        },
        234: {
          externalId: '234',
          name: 'Vulploeg twee',
        },
        235: {
          externalId: '235',
          name: 'New team',
        },
      });
    });
  });

  describe('executeTeamActions', () => {
    let sandbox;

    before(async () => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(teamRepository, 'create').returns(Promise.resolve({}));
      sandbox.stub(teamRepository, 'update').returns(Promise.resolve({}));
      sandbox.stub(teamRepository, 'deleteById').returns(Promise.resolve({}));

      const teamActions = impl.createTeamActions(internalTeams, externalTeams);
      await impl.executeTeamActions('1', teamActions);
    });

    after(() => sandbox.reset());

    it('should execute correct function for add action', async () => {
      assert.equal(teamRepository.create.callCount, 1);
      assert.deepEqual(teamRepository.create.firstCall.args[0], {
        networkId: '1', externalId: '235', name: 'New team',
      });
    });

    it('should execute correct function for update action', async () => {
      assert.equal(teamRepository.update.callCount, 2);
      assert.deepEqual(teamRepository.update.firstCall.args[0], {
        networkId: '1', externalId: '240',
      });
      assert.deepEqual(teamRepository.update.firstCall.args[1], {
        name: 'Hodor',
      });
      assert.deepEqual(teamRepository.update.secondCall.args[0], {
        networkId: '1', externalId: '234',
      });
      assert.deepEqual(teamRepository.update.secondCall.args[1], {
        name: 'Vulploeg twee',
      });
    });

    it('should execute correct function for delete action', async () => {
      assert.equal(teamRepository.deleteById.callCount, 1);
      assert.deepEqual(teamRepository.deleteById.firstCall.args[0], '3');
    });
  });

  describe('createUserActions', () => {
    it('should set correct user to be added to network', () => {
      const internalUsers = [{
        id: '1',
        externalId: '23',
        email: 'foo@baz.com',
        teamIds: [],
        deletedAt: new Date(),
      }];

      const usersInSystem = [{
        id: '1',
        externalId: null,
        email: 'foo@baz.com',
        teamIds: [],
        deletedAt: null,
      }, {
        id: '3',
        externalId: null,
        email: 'added@baz.com',
        teamIds: [],
        deletedAt: null,
      }];

      const externalUsers = [{
        externalId: '23',
        email: 'foo@baz.com',
        teamIds: [],
        deletedAt: null,
      }, {
        externalId: '234',
        email: 'added@baz.com',
        teamIds: [],
        deletedAt: null,
      }];

      const userActions = impl.createUserActions(usersInSystem, [], internalUsers, externalUsers);

      assert.deepEqual(userActions.add, ['foo@baz.com', 'added@baz.com']);
      assert.deepEqual(userActions.remove, []);
      assert.deepEqual(userActions.changedTeams, []);
      assert.deepEqual(userActions.data, {
        'foo@baz.com': {
          id: '1',
          externalId: '23',
          email: 'foo@baz.com',
          teamIds: [],
          externalTeamIds: [],
          deletedAt: null,
        },
        'added@baz.com': {
          id: '3',
          externalId: '234',
          email: 'added@baz.com',
          teamIds: [],
          externalTeamIds: [],
          deletedAt: null,
        },
      });
    });

    it('should set correct user to be created in system', () => {
      const internalUsers = [];
      const usersInSystem = [];

      const externalUsers = [{
        externalId: '234',
        email: 'new@baz.com',
        teamIds: [],
        deletedAt: null,
      }];

      const userActions = impl.createUserActions(usersInSystem, [], internalUsers, externalUsers);

      assert.deepEqual(userActions.create, ['new@baz.com']);
      assert.deepEqual(userActions.remove, []);
      assert.deepEqual(userActions.add, []);
      assert.deepEqual(userActions.changedTeams, []);
      assert.deepEqual(userActions.data, {
        'new@baz.com': {
          externalId: '234',
          email: 'new@baz.com',
          externalTeamIds: [],
          deletedAt: null,
        },
      });
    });

    it('should set correct user to be removed from network', () => {
      const now = new Date();
      const internalUsers = [{
        id: '1',
        externalId: '23',
        email: 'foo@baz.com',
        teamIds: [],
        deletedAt: null,
      }, {
        id: '2',
        externalId: '24',
        email: 'removed@baz.com',
        teamIds: [],
        deletedAt: null,
      }];

      const usersInSystem = internalUsers;

      const externalUsers = [{
        externalId: '23',
        email: 'foo@baz.com',
        teamIds: [],
        deletedAt: now,
      }];

      const userActions = impl.createUserActions(usersInSystem, [], internalUsers, externalUsers);

      assert.deepEqual(userActions.remove, ['removed@baz.com', 'foo@baz.com']);
      assert.deepEqual(userActions.create, []);
      assert.deepEqual(userActions.add, []);
      assert.deepEqual(userActions.changedTeams, []);
      assert.deepEqual(userActions.data, {
        'foo@baz.com': {
          id: '1',
          externalId: '23',
          email: 'foo@baz.com',
          teamIds: [],
          externalTeamIds: [],
          deletedAt: now,
        },
        'removed@baz.com': {
          id: '2',
          externalId: '24',
          email: 'removed@baz.com',
          teamIds: [],
          deletedAt: null,
        },
      });
    });

    it('should handle team changes and network add from the same user at the same time', () => {
      const internalUsers = [{
        id: '1',
        externalId: '23',
        email: 'foo@baz.com',
        teamIds: ['1', '2'],
        deletedAt: null,
      }, {
        id: '2',
        externalId: '254',
        email: 'changed@baz.com',
        teamIds: ['1', '2', '3'],
        deletedAt: new Date(),
      }];

      const usersInSystem = internalUsers;

      const externalUsers = [{
        externalId: '23',
        email: 'foo@baz.com',
        teamIds: ['240', '234'],
        deletedAt: null,
      }, {
        externalId: '254',
        email: 'changed@baz.com',
        teamIds: ['240'],
        deletedAt: null,
      }];

      const userActions = impl.createUserActions(
        usersInSystem, internalTeams, internalUsers, externalUsers);

      assert.deepEqual(userActions.changedTeams, ['changed@baz.com']);
      assert.deepEqual(userActions.remove, []);
      assert.deepEqual(userActions.create, []);
      assert.deepEqual(userActions.add, ['changed@baz.com']);
      assert.deepEqual(userActions.data, {
        'foo@baz.com': {
          id: '1',
          externalId: '23',
          email: 'foo@baz.com',
          teamIds: ['240', '234'],
          externalTeamIds: ['240', '234'],
          deletedAt: null,
        },
        'changed@baz.com': {
          id: '2',
          externalId: '254',
          email: 'changed@baz.com',
          teamIds: ['240', '234', '232'],
          externalTeamIds: ['240'],
          deletedAt: null,
        },
      });
    });

    it('should add correct values for team link changes', () => {
      const internalUsers = [{
        id: '1',
        externalId: '23',
        email: 'foo@baz.com',
        teamIds: ['1', '2'],
        deletedAt: null,
      }, {
        id: '2',
        externalId: '254',
        email: 'changed@baz.com',
        teamIds: ['1', '2', '3'],
        deletedAt: null,
      }];

      const usersInSystem = internalUsers;

      const externalUsers = [{
        externalId: '23',
        email: 'foo@baz.com',
        teamIds: ['240', '234'],
        deletedAt: null,
      }, {
        externalId: '254',
        email: 'changed@baz.com',
        teamIds: ['240'],
        deletedAt: null,
      }];

      const userActions = impl.createUserActions(
        usersInSystem, internalTeams, internalUsers, externalUsers);

      assert.deepEqual(userActions.changedTeams, ['changed@baz.com']);
      assert.deepEqual(userActions.remove, []);
      assert.deepEqual(userActions.create, []);
      assert.deepEqual(userActions.add, []);
      assert.deepEqual(userActions.data, {
        'foo@baz.com': {
          id: '1',
          externalId: '23',
          email: 'foo@baz.com',
          teamIds: ['240', '234'],
          externalTeamIds: ['240', '234'],
          deletedAt: null,
        },
        'changed@baz.com': {
          id: '2',
          externalId: '254',
          email: 'changed@baz.com',
          teamIds: ['240', '234', '232'],
          externalTeamIds: ['240'],
          deletedAt: null,
        },
      });
    });
  });

  describe('executeUserActions', () => {
    let sandbox;

    before(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(teamRepository, 'removeUserFromTeam').returns(Promise.resolve({}));
      sandbox.stub(teamRepository, 'addUserToTeam').returns(Promise.resolve({}));
      sandbox.stub(userRepository, 'setNetworkLink').returns(Promise.resolve({}));
      sandbox.stub(userRepository, 'createUser').returns(Promise.resolve({}));
      sandbox.stub(networkRepository, 'findTeamsForNetwork').returns(Promise.resolve([{
        id: '21',
        networkId: '1',
        externalId: '1',
        name: 'First team',
      }, {
        id: '22',
        networkId: '1',
        externalId: '2',
        name: 'Second team',
      }, {
        id: '23',
        networkId: '1',
        externalId: '3',
        name: 'Third team',
      }]));
    });

    afterEach(() => sandbox.reset());

    it('should execute correct function for add action', async () => {
      await impl.executeUserActions('1', {
        add: ['foo@baz.com'],
        create: [],
        remove: [],
        changedTeams: [],
        data: {
          'foo@baz.com': {
            id: '1',
            externalId: '23',
            email: 'foo@baz.com',
            teamIds: ['1', '2'],
            deletedAt: null,
          },
        },
      });

      assert.equal(userRepository.setNetworkLink.callCount, 1);
      assert.deepEqual(userRepository.setNetworkLink.firstCall.args[0], {
        externalId: '23',
        networkId: '1',
      });
      assert.deepEqual(userRepository.setNetworkLink.firstCall.args[1], {
        externalId: '23',
        userId: '1',
        deletedAt: null,
        networkId: '1',
        roleType: 'EMPLOYEE',
      });
    });

    it('should execute correct function for create action', async () => {
      await impl.executeUserActions('1', {
        add: [],
        create: ['new@baz.com'],
        remove: [],
        changedTeams: [],
        data: {
          'new@baz.com': {
            firstName: 'John',
            lastName: 'Doe',
            externalId: '21',
            email: 'new@baz.com',
            teamIds: ['1', '2'],
          },
        },
      });

      assert.equal(userRepository.createUser.callCount, 1);
      assert.equal(userRepository.createUser.firstCall.args[0].username, 'new@baz.com');
      assert.equal(userRepository.createUser.firstCall.args[0].email, 'new@baz.com');
      assert.equal(userRepository.createUser.firstCall.args[0].firstName, 'John');
      assert.equal(userRepository.createUser.firstCall.args[0].lastName, 'Doe');
      assert.property(userRepository.createUser.firstCall.args[0], 'password');

      assert.equal(userRepository.setNetworkLink.firstCall.args[0].networkId, '1');
      assert.equal(userRepository.setNetworkLink.firstCall.args[0].externalId, '21');
      assert.isNotNull(userRepository.setNetworkLink.firstCall.args[1], 'userId');
      assert.equal(userRepository.setNetworkLink.firstCall.args[1].networkId, '1');
      assert.equal(userRepository.setNetworkLink.firstCall.args[1].deletedAt, null);
      assert.equal(userRepository.setNetworkLink.firstCall.args[1].roleType, 'EMPLOYEE');
      assert.equal(userRepository.setNetworkLink.firstCall.args[1].externalId, '21');
    });

    it('should execute correct function for remove action', async () => {
      await impl.executeUserActions('1', {
        add: [],
        create: [],
        remove: ['removed@baz.com'],
        changedTeams: [],
        data: {
          'removed@baz.com': {
            id: '3',
            externalId: '244',
            email: 'removed@baz.com',
            teamIds: ['1', '2'],
            externalTeamIds: ['1', '2'],
          },
        },
      });

      assert.equal(userRepository.setNetworkLink.callCount, 1);
      assert.equal(userRepository.setNetworkLink.firstCall.args[0].networkId, '1');
      assert.equal(userRepository.setNetworkLink.firstCall.args[0].externalId, '244');
      assert.isNotNull(userRepository.setNetworkLink.firstCall.args[1].deletedAt);
    });

    it('should execute correct function for changedTeams', async () => {
      await impl.executeUserActions('1', {
        add: [],
        create: [],
        remove: [],
        changedTeams: ['changed@baz.com'],
        data: {
          'changed@baz.com': {
            id: '2',
            externalId: '254',
            email: 'changed@baz.com',
            externalTeamIds: ['1', '2'],
            teamIds: ['1', '3'],
            deletedAt: null,
          },
        },
      });

      assert.equal(teamRepository.removeUserFromTeam.callCount, 1);
      assert.equal(teamRepository.removeUserFromTeam.firstCall.args[0], '23');
      assert.equal(teamRepository.removeUserFromTeam.firstCall.args[1], '2');

      assert.equal(teamRepository.addUserToTeam.callCount, 1);
      assert.equal(teamRepository.addUserToTeam.firstCall.args[0], '22');
      assert.equal(teamRepository.addUserToTeam.firstCall.args[1], '2');
    });
  });
});
