const { assert } = require('chai');
const R = require('ramda');
const { find, pick } = require('lodash');
const sinon = require('sinon');
const testHelper = require('../../../shared/test-utils/helpers');
const networkRepo = require('../../core/repositories/network');
const userRepo = require('../../core/repositories/user');
const teamRepo = require('../../core/repositories/team');
const EmployeeDispatcher = require('../dispatcher');
const service = require('./invite-user');

describe('Service: Invite user', () => {
  let employee;
  let network;
  let team;

  before(async () => {
    const [admin, user] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
    ]);
    employee = user;
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexAppeal' });
    await testHelper.addUserToNetwork({ userId: employee.id, networkId: network.id });
    team = await teamRepo.create({
      networkId: network.id,
      name: 'Cool Team',
    });
  });

  after(() => testHelper.cleanAll());

  describe('Existing User', () => {
    let existingUser;

    before(async () => {
      existingUser = await testHelper.createUser(
        { email: 'god@flex-appeal.nl',
          password: 'pw',
          firstName: 'existing',
          lastName: 'User',
          username: 'god@flex-appeal.nl',
        });
    });

    afterEach(() => userRepo.removeFromNetwork(existingUser.id, network.id));

    it('should fail when user belongs to the network', async () => {
      const { firstName, lastName, email } = employee;
      const payload = { firstName, lastName, email };

      await assert.isRejected(service.inviteUser(payload, { network }));
    });

    xit('should fail when team doesn\'t belongs to the network', async () => {
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
      assert.isNotNull(actual.invitedAt);
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
      const extraTeam = await teamRepo.create({
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
    let eventEmitterStub;
    const credentials = { id: '1', email: 'credentials@flex-appeal.nl' };
    const payload = { firstName: 'John', lastName: 'Doe', email: 'test-user@foo.com' };

    before(() => {
      eventEmitterStub = sandbox.stub(EmployeeDispatcher, 'emit');
    });

    afterEach(async () => {
      eventEmitterStub.reset();
      const user = await userRepo.findUserBy({ email: payload.email });

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
      assert.isNotNull(actual.invitedAt);
    });

    it('should dispatch user.created event', async () => {
      await service.inviteUser(payload, { credentials, network });

      const { args } = eventEmitterStub.firstCall;

      assert.equal(args[0], 'user.created');
      assert.deepEqual(args[1].credentials, credentials);
      assert.deepEqual(pick(args[1].user, 'email', 'firstName', 'lastName'), payload);
      assert.deepEqual(args[1].network, network);
    });

    it('should add to the network as admin', async () => {
      const actual = await service.inviteUser(R.merge(payload, { roleType: 'admin' }), { network });

      assert.equal(actual.roleType, 'ADMIN');
    });

    it('should add to the network as employee', async () => {
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.roleType, 'EMPLOYEE');
    });

    it('should add to the teams', async () => {
      const serviceResult = await service.inviteUser(R.merge(
        payload,
        { teamIds: [team.id] }),
        { network });

      const teamsLookup = await teamRepo.findTeamsForNetworkThatUserBelongsTo(
        serviceResult.id, network.id);

      assert.isDefined(find(teamsLookup, { id: team.id.toString() }));
    });

    it('should add to the multiple teams', async () => {
      const extraTeam = await teamRepo.create({
        networkId: network.id,
        name: 'Cool Team',
      });

      const serviceResult = await service.inviteUser(
        R.merge(payload, { teamIds: [team.id, extraTeam.id] }),
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
      const extraTeam = await teamRepo.create({
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
