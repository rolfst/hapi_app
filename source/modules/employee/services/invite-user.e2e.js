import { assert } from 'chai';
import { find, pick } from 'lodash';
import sinon from 'sinon';
import * as dispatchEvent from '../../../shared/services/dispatch-event';
import * as networkRepo from '../../core/repositories/network';
import * as userRepo from '../../core/repositories/user';
import * as teamRepo from '../../core/repositories/team';
import * as service from './invite-user';

describe('Service: invite user', () => {
  let network;
  let team;

  before(async () => {
    network = global.networks.flexAppeal;
    team = await teamRepo.createTeam({
      networkId: network.id,
      name: 'Cool Team',
    });
  });

  after(() => teamRepo.deleteById(team.id));

  describe('Existing User', () => {
    let existingUser;

    before(() => (existingUser = global.users.networklessUser));
    afterEach(() => userRepo.removeFromNetwork(existingUser.id, network.id));

    it('should fail when user belongs to the network', async () => {
      const { firstName, lastName, email } = global.users.employee;
      const payload = { firstName, lastName, email };

      await assert.isRejected(service.inviteUser(payload, { network }));
    });

    it('should fail when team doesn\'t belongs to the network', async () => {
      // TODO
    });

    it('should add to the network as admin', async () => {
      const { firstName, lastName, email } = existingUser;
      const payload = { firstName, lastName, email, roleType: 'admin' };
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.firstName, firstName);
      assert.equal(actual.lastName, lastName);
      assert.equal(actual.username, email);
      assert.equal(actual.email, email);
      assert.equal(actual.roleType, 'ADMIN');
    });

    it('should add to the network as employee', async () => {
      const { firstName, lastName, email } = existingUser;
      const payload = { firstName, lastName, email };
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.roleType, 'EMPLOYEE');
    });

    it('should add to the teams', async () => {
      const { firstName, lastName, email } = existingUser;
      const payload = { firstName, lastName, email, teamIds: [team.id] };
      const serviceResult = await service.inviteUser(payload, { network });
      const teamsLookup = await teamRepo.findTeamsForNetworkThatUserBelongsTo(
        serviceResult.id, network.id);

      assert.isDefined(find(teamsLookup, { id: team.id.toString() }));
      assert.equal(teamsLookup.length, 1);
    });

    it('should add to the multiple teams', async () => {
      const extraTeam = await teamRepo.createTeam({
        networkId: network.id,
        name: 'Cool Team',
      });

      const { firstName, lastName, email } = existingUser;
      const payload = { firstName, lastName, email, teamIds: [team.id, extraTeam.id] };
      const serviceResult = await service.inviteUser(payload, { network });
      const teamsLookup = await teamRepo.findTeamsForNetworkThatUserBelongsTo(
        serviceResult.id, network.id);

      assert.equal(teamsLookup.length, 2);

      await teamRepo.deleteById(extraTeam.id);
    });
  });

  describe('New User', () => {
    const sandbox = sinon.sandbox.create();
    let dispatchEventSpy;
    const credentials = { id: '1', email: 'credentials@flex-appeal.nl' };
    const payload = { firstName: 'John', lastName: 'Doe', email: 'test-user@foo.com' };

    before(() => {
      dispatchEventSpy = sandbox.stub(dispatchEvent, 'dispatchEvent');
    });

    afterEach(async () => {
      dispatchEventSpy.reset();

      const user = await userRepo.findUserByEmail(payload.email);

      return userRepo.deleteById(user.id);
    });

    after(() => {
      sandbox.restore();
    });

    it('should create when not exists', async () => {
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.firstName, payload.firstName);
      assert.equal(actual.lastName, payload.lastName);
      assert.equal(actual.username, payload.email);
      assert.equal(actual.email, payload.email);
    });

    it('should dispatch USER_INVITED event', async () => {
      await service.inviteUser(payload, { credentials, network });

      const { args } = dispatchEventSpy.firstCall;

      assert.equal(args[0], dispatchEvent.EventTypes.USER_INVITED);
      assert.equal(args[1], credentials);
      assert.deepEqual(pick(args[2].user, 'email', 'firstName', 'lastName'), payload);
      assert.deepEqual(args[2].network, network);
    });

    it('should add to the network as admin', async () => {
      const actual = await service.inviteUser({ ...payload, roleType: 'admin' }, { network });

      assert.equal(actual.roleType, 'ADMIN');
    });

    it('should add to the network as employee', async () => {
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.roleType, 'EMPLOYEE');
    });

    it('should add to the teams', async () => {
      const serviceResult = await service.inviteUser({
        ...payload,
        teamIds: [team.id] },
        { network });

      const teamsLookup = await teamRepo.findTeamsForNetworkThatUserBelongsTo(
        serviceResult.id, network.id);

      assert.isDefined(find(teamsLookup, { id: team.id.toString() }));
    });

    it('should add to the multiple teams', async () => {
      const extraTeam = await teamRepo.createTeam({
        networkId: network.id,
        name: 'Cool Team',
      });

      const serviceResult = await service.inviteUser(
        { ...payload, teamIds: [team.id, extraTeam.id] },
        { network });

      const teamsLookup = await teamRepo.findTeamsForNetworkThatUserBelongsTo(
        serviceResult.id, network.id);

      assert.equal(teamsLookup.length, 2);

      await teamRepo.deleteById(extraTeam.id);
    });
  });

  describe('Deleted User', () => {
    let deletedUser;

    before(async () => {
      const attributes = {
        username: 'removeduser@example.xyz',
        firstName: 'Removed',
        lastName: 'Doe',
        email: 'removeduser@example.xyz',
        password: 'foopassword',
      };

      deletedUser = await userRepo.createUser(attributes);

      return networkRepo.addUser({
        userId: deletedUser.id,
        networkId: network.id,
        deletedAt: new Date(),
      });
    });

    beforeEach(() => userRepo.removeFromNetwork(deletedUser.id, network.id));
    after(() => userRepo.deleteById(deletedUser.id));

    it('should add to the network as admin', async () => {
      const { firstName, lastName, email } = deletedUser;
      const payload = { firstName, lastName, email, roleType: 'admin' };
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.roleType, 'ADMIN');
      assert.equal(actual.deletedAt, null);
    });

    it('should add to the network as employee', async () => {
      const { firstName, lastName, email } = deletedUser;
      const payload = { firstName, lastName, email };
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.roleType, 'EMPLOYEE');
      assert.equal(actual.deletedAt, null);
    });

    it('should add to the teams', async () => {
      const { firstName, lastName, email } = deletedUser;
      const payload = { firstName, lastName, email, teamIds: [team.id] };
      const serviceResult = await service.inviteUser(payload, { network });
      const teamsLookup = await teamRepo.findTeamsForNetworkThatUserBelongsTo(
        serviceResult.id, network.id);

      assert.isDefined(find(teamsLookup, { id: team.id.toString() }));
      assert.equal(teamsLookup.length, 1);
    });

    it('should add to the multiple teams', async () => {
      const extraTeam = await teamRepo.createTeam({
        networkId: network.id,
        name: 'Cool Team',
      });

      const { firstName, lastName, email } = deletedUser;
      const payload = { firstName, lastName, email, teamIds: [team.id, extraTeam.id] };
      const serviceResult = await service.inviteUser(payload, { network });
      const teamsLookup = await teamRepo.findTeamsForNetworkThatUserBelongsTo(
        serviceResult.id, network.id);

      assert.equal(teamsLookup.length, 2);

      await teamRepo.deleteById(extraTeam.id);
    });
  });
});
