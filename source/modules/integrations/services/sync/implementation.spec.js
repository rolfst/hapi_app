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

      assert.deepEqual(teamActions.add, [{
        externalId: '235',
        name: 'New team',
      }]);
    });

    it('should set correct teams to be updated', () => {
      const teamActions = impl.createTeamActions(internalTeams, externalTeams);

      assert.deepEqual(teamActions.update, [{
        externalId: '240',
        name: 'Hodor',
      }, {
        externalId: '234',
        name: 'Vulploeg twee',
      }]);
    });

    it('should set correct teams to be deleted', () => {
      const teamActions = impl.createTeamActions(internalTeams, externalTeams);

      assert.deepEqual(teamActions.delete, ['3']);
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
    describe('Action: add', () => {
      it('should add user that already exists but is deleted', () => {
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
        }];

        const externalUsers = [{
          externalId: '23',
          email: 'foo@baz.com',
          teamIds: [],
          deletedAt: null,
        }];

        const userActions = impl.createUserActions(usersInSystem, [], internalUsers, externalUsers);
        assert.deepEqual(userActions.remove, []);
        assert.deepEqual(userActions.changedTeams, []);
        assert.deepEqual(userActions.add, [{
          id: '1',
          externalId: '23',
          email: 'foo@baz.com',
          teamIds: [],
          externalTeamIds: [],
          deletedAt: null,
        }]);
      });

      it('should add user that is not member of the network', () => {
        const internalUsers = [];
        const usersInSystem = [{
          id: '1',
          externalId: '23',
          email: 'added@baz.com',
          teamIds: [],
          deletedAt: null,
        }];

        const externalUsers = [{
          externalId: '23',
          email: 'added@baz.com',
          teamIds: [],
          deletedAt: null,
        }];

        const userActions = impl.createUserActions(usersInSystem, [], internalUsers, externalUsers);
        assert.deepEqual(userActions.remove, []);
        assert.deepEqual(userActions.changedTeams, []);
        assert.deepEqual(userActions.add, [{
          id: '1',
          externalId: '23',
          email: 'added@baz.com',
          teamIds: [],
          externalTeamIds: [],
          deletedAt: null,
        }]);
      });

      it('should ignore users that are inactive from the external system', () => {
        const internalUsers = [{
          id: '1',
          externalId: '23',
          email: 'added@baz.com',
          teamIds: [],
          deletedAt: new Date(),
        }];

        const usersInSystem = [{
          id: '1',
          externalId: null,
          email: 'added@baz.com',
          teamIds: [],
          deletedAt: null,
        }];

        const externalUsers = [{
          externalId: '23',
          email: 'added@baz.com',
          teamIds: [],
          deletedAt: null,
        }, {
          externalId: '24',
          email: 'inactive@baz.com',
          teamIds: [],
          deletedAt: new Date(),
        }];

        const userActions = impl.createUserActions(usersInSystem, [], internalUsers, externalUsers);
        assert.deepEqual(userActions.remove, []);
        assert.deepEqual(userActions.changedTeams, []);
        assert.deepEqual(userActions.add, [{
          id: '1',
          externalId: '23',
          email: 'added@baz.com',
          externalTeamIds: [],
          teamIds: [],
          deletedAt: null,
        }]);
      });

      it('should not add users that are active in network and external system', () => {
        const internalUsers = [{
          id: '1',
          externalId: '23',
          email: 'added@baz.com',
          teamIds: [],
          deletedAt: null,
        }];

        const usersInSystem = [{
          id: '1',
          externalId: null,
          email: 'added@baz.com',
          teamIds: [],
          deletedAt: null,
        }];

        const externalUsers = [{
          externalId: '23',
          email: 'added@baz.com',
          teamIds: [],
          deletedAt: null,
        }];

        const userActions = impl.createUserActions(usersInSystem, [], internalUsers, externalUsers);
        assert.deepEqual(userActions.remove, []);
        assert.deepEqual(userActions.changedTeams, []);
        assert.deepEqual(userActions.add, []);
      });
    });

    describe('Action: create', () => {
      it('should create when external user is not present in our system', () => {
        const internalUsers = [];
        const usersInSystem = [];

        const externalUsers = [{
          externalId: '234',
          email: 'new@baz.com',
          teamIds: [],
          deletedAt: null,
        }];

        const userActions = impl.createUserActions(usersInSystem, [], internalUsers, externalUsers);

        assert.deepEqual(userActions.remove, []);
        assert.deepEqual(userActions.add, []);
        assert.deepEqual(userActions.changedTeams, []);
        assert.deepEqual(userActions.create, [{
          externalId: '234',
          email: 'new@baz.com',
          externalTeamIds: [],
          deletedAt: null,
        }]);
      });
    });

    describe('Action: remove', () => {
      it('should never remove guest users', () => {
        const internalUsers = [{
          id: '1',
          externalId: null,
          email: 'guest@baz.com',
          teamIds: [],
          deletedAt: null,
        }];

        const usersInSystem = internalUsers;
        const externalUsers = [];

        const userActions = impl.createUserActions(usersInSystem, [], internalUsers, externalUsers);

        assert.deepEqual(userActions.create, []);
        assert.deepEqual(userActions.add, []);
        assert.deepEqual(userActions.changedTeams, []);
        assert.deepEqual(userActions.remove, []);
      });

      it('should remove active users in network that are inactive in external system', () => {
        const internalUsers = [{
          id: '1',
          externalId: '23',
          email: 'removed@baz.com',
          teamIds: [],
          deletedAt: null,
        }];

        const usersInSystem = internalUsers;

        const externalUsers = [{
          externalId: '23',
          email: 'removed@baz.com',
          teamIds: [],
          deletedAt: new Date(),
        }];

        const userActions = impl.createUserActions(usersInSystem, [], internalUsers, externalUsers);

        assert.deepEqual(userActions.create, []);
        assert.deepEqual(userActions.add, []);
        assert.deepEqual(userActions.changedTeams, []);
        assert.deepEqual(userActions.remove, [{
          id: '1',
          externalId: '23',
          email: 'removed@baz.com',
          teamIds: [],
          deletedAt: null,
        }]);
      });

      it('should remove users that are not present in external system ', () => {
        const internalUsers = [{
          id: '1',
          externalId: '23',
          email: 'removed@baz.com',
          teamIds: [],
          deletedAt: null,
        }];

        const usersInSystem = internalUsers;
        const externalUsers = [];

        const userActions = impl.createUserActions(usersInSystem, [], internalUsers, externalUsers);

        assert.deepEqual(userActions.create, []);
        assert.deepEqual(userActions.add, []);
        assert.deepEqual(userActions.changedTeams, []);
        assert.deepEqual(userActions.remove, [{
          id: '1',
          externalId: '23',
          email: 'removed@baz.com',
          teamIds: [],
          deletedAt: null,
        }]);
      });

      it('should ignore users that are inactive in network and external system ', () => {
        const internalUsers = [{
          id: '1',
          externalId: '23',
          email: 'removed@baz.com',
          teamIds: [],
          deletedAt: new Date(),
        }];

        const usersInSystem = internalUsers;
        const externalUsers = [{
          externalId: '23',
          email: 'removed@baz.com',
          teamIds: [],
          deletedAt: new Date(),
        }];

        const userActions = impl.createUserActions(usersInSystem, [], internalUsers, externalUsers);

        assert.deepEqual(userActions.create, []);
        assert.deepEqual(userActions.add, []);
        assert.deepEqual(userActions.changedTeams, []);
        assert.deepEqual(userActions.remove, []);
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

      assert.deepEqual(userActions.changedTeams, [{
        id: '2',
        externalId: '254',
        email: 'changed@baz.com',
        teamIds: ['232', '234', '240'],
        externalTeamIds: ['240'],
        deletedAt: null,
      }]);
      assert.deepEqual(userActions.remove, []);
      assert.deepEqual(userActions.create, []);
      assert.deepEqual(userActions.add, [{
        id: '2',
        externalId: '254',
        email: 'changed@baz.com',
        teamIds: ['232', '234', '240'],
        externalTeamIds: ['240'],
        deletedAt: null,
      }]);
    });

    it('should add correct values for team link changes when user is in network', () => {
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
        teamIds: ['234', '240'],
        deletedAt: null,
      }, {
        externalId: '254',
        email: 'changed@baz.com',
        teamIds: ['240'],
        deletedAt: null,
      }];

      const userActions = impl.createUserActions(
        usersInSystem, internalTeams, internalUsers, externalUsers);

      assert.deepEqual(userActions.changedTeams, [{
        id: '2',
        externalId: '254',
        email: 'changed@baz.com',
        teamIds: ['232', '234', '240'],
        externalTeamIds: ['240'],
        deletedAt: null,
      }]);
      assert.deepEqual(userActions.remove, []);
      assert.deepEqual(userActions.create, []);
      assert.deepEqual(userActions.add, []);
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
        add: [{
          id: '1',
          externalId: '23',
          email: 'foo@baz.com',
          teamIds: ['1', '2'],
          deletedAt: null,
        }],
        create: [],
        remove: [],
        changedTeams: [],
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
        create: [{
          firstName: 'John',
          lastName: 'Doe',
          externalId: '21',
          email: 'new@baz.com',
          teamIds: ['1', '2'],
          deletedAt: new Date(),
        }],
        remove: [],
        changedTeams: [],
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
      assert.isNotNull(userRepository.setNetworkLink.firstCall.args[1].deletedAt, null);
      assert.equal(userRepository.setNetworkLink.firstCall.args[1].roleType, 'EMPLOYEE');
      assert.equal(userRepository.setNetworkLink.firstCall.args[1].externalId, '21');
    });

    it('should execute correct function for remove action', async () => {
      await impl.executeUserActions('1', {
        add: [],
        create: [],
        remove: [{
          id: '3',
          externalId: '244',
          email: 'removed@baz.com',
          teamIds: ['1', '2'],
          externalTeamIds: ['1', '2'],
        }],
        changedTeams: [],
      });

      assert.equal(userRepository.setNetworkLink.callCount, 1);
      assert.equal(userRepository.setNetworkLink.firstCall.args[0].networkId, '1');
      assert.equal(userRepository.setNetworkLink.firstCall.args[0].userId, '3');
      assert.isNotNull(userRepository.setNetworkLink.firstCall.args[1].deletedAt);
      assert.equal(userRepository.setNetworkLink.firstCall.args[1].externalId, '244');
      assert.equal(userRepository.setNetworkLink.firstCall.args[1].userId, '3');
      assert.equal(userRepository.setNetworkLink.firstCall.args[1].networkId, '1');
    });

    it('should execute correct function for changedTeams', async () => {
      await impl.executeUserActions('1', {
        add: [],
        create: [],
        remove: [],
        changedTeams: [{
          id: '2',
          externalId: '254',
          email: 'changed@baz.com',
          externalTeamIds: ['1', '2'],
          teamIds: ['1', '3'],
          deletedAt: null,
        }],
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
