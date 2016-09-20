import { assert } from 'chai';
import { find } from 'lodash';
import { findUserByEmail } from 'shared/repositories/user';
import { createTeam } from 'shared/repositories/team';
import * as service from 'modules/employee/services/invite-user';

describe('Service: invite user', () => {
  let network;
  let team;

  before(async () => {
    network = global.networks.flexAppeal;
    team = await createTeam({
      networkId: network.id,
      name: 'Cool Team',
    });
  });

  after(() => team.destroy());

  describe('Existing User', () => {
    let existingUser;

    before(() => (existingUser = global.users.networklessUser));
    afterEach(() => existingUser.setNetworks([]));

    it('should fail when user belongs to the network', async () => {
      const { firstName, lastName, email } = global.users.employee;
      const payload = { firstName, lastName, email };

      assert.isRejected(service.inviteUser(payload, { network }));
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
      assert.equal(actual.Networks[0].NetworkUser.roleType, 'ADMIN');
    });

    it('should add to the network as employee', async () => {
      const { firstName, lastName, email } = existingUser;
      const payload = { firstName, lastName, email };
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.Networks[0].id, network.id);
      assert.equal(actual.Networks[0].NetworkUser.roleType, 'EMPLOYEE');
    });

    it('should add to the teams', async () => {
      const { firstName, lastName, email } = existingUser;
      const payload = { firstName, lastName, email, teamIds: [team.id] };
      const actual = await service.inviteUser(payload, { network });

      assert.isDefined(find(actual.Teams, { id: team.id }));
      assert.equal(actual.Teams.length, 1);
    });

    it('should add to the multiple teams', async () => {
      const extraTeam = await createTeam({
        networkId: network.id,
        name: 'Cool Team',
      });

      const { firstName, lastName, email } = existingUser;
      const payload = { firstName, lastName, email, teamIds: [team.id, extraTeam.id] };
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.Teams.length, 2);

      await extraTeam.destroy();
    });
  });

  describe('New User', () => {
    const payload = { firstName: 'John', lastName: 'Doe', email: 'test-user@foo.com' };

    afterEach(() => findUserByEmail(payload.email).then(u => u.destroy()));

    it('should create when not exists', async () => {
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.firstName, payload.firstName);
      assert.equal(actual.lastName, payload.lastName);
      assert.equal(actual.username, payload.email);
      assert.equal(actual.email, payload.email);
    });

    it('should add to the network as admin', async () => {
      const actual = await service.inviteUser({ ...payload, roleType: 'admin' }, { network });
      assert.equal(actual.Networks[0].id, network.id);
      assert.equal(actual.Networks[0].NetworkUser.roleType, 'ADMIN');
    });

    it('should add to the network as employee', async () => {
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.Networks[0].id, network.id);
      assert.equal(actual.Networks[0].NetworkUser.roleType, 'EMPLOYEE');
    });

    it('should add to the teams', async () => {
      const actual = await service.inviteUser({ ...payload, teamIds: [team.id] }, { network });

      assert.isDefined(find(actual.Teams, { id: team.id }));
    });

    it('should add to the multiple teams', async () => {
      const extraTeam = await createTeam({
        networkId: network.id,
        name: 'Cool Team',
      });

      const actual = await service.inviteUser(
        { ...payload, teamIds: [team.id, extraTeam.id] },
        { network });

      assert.equal(actual.Teams.length, 2);

      await extraTeam.destroy();
    });
  });

  describe('Deleted User', () => {
    let deletedUser;

    before(() => {
      deletedUser = global.users.networklessUser;

      return Promise.all([deletedUser.setTeams([]), deletedUser.setNetworks([])]);
    });

    beforeEach(() => deletedUser.addNetwork(network, { deletedAt: new Date() }));
    afterEach(() => deletedUser.setNetworks([]));

    it('should add to the network as admin', async () => {
      const { firstName, lastName, email } = deletedUser;
      const payload = { firstName, lastName, email, roleType: 'admin' };
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.Networks[0].NetworkUser.roleType, 'ADMIN');
      assert.equal(actual.Networks[0].NetworkUser.deletedAt, null);
    });

    it('should add to the network as employee', async () => {
      const { firstName, lastName, email } = deletedUser;
      const payload = { firstName, lastName, email };
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.Networks[0].id, network.id);
      assert.equal(actual.Networks[0].NetworkUser.roleType, 'EMPLOYEE');
      assert.equal(actual.Networks[0].NetworkUser.deletedAt, null);
    });

    it('should add to the teams', async () => {
      const { firstName, lastName, email } = deletedUser;
      const payload = { firstName, lastName, email, teamIds: [team.id] };
      const actual = await service.inviteUser(payload, { network });

      assert.isDefined(find(actual.Teams, { id: team.id }));
      assert.equal(actual.Teams.length, 1);
    });

    it('should add to the multiple teams', async () => {
      const extraTeam = await createTeam({
        networkId: network.id,
        name: 'Cool Team',
      });

      const { firstName, lastName, email } = deletedUser;
      const payload = { firstName, lastName, email, teamIds: [team.id, extraTeam.id] };
      const actual = await service.inviteUser(payload, { network });

      assert.equal(actual.Teams.length, 2);

      await extraTeam.destroy();
    });
  });
});
