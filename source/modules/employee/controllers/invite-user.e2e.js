import { assert } from 'chai';
import { find } from 'lodash';
import { findUserByEmail } from 'common/repositories/user';
import { createTeam } from 'common/repositories/team';
import * as controller from 'modules/employee/controllers/invite-user';

describe('Invite user #Controller', () => {
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
      const { firstName, email } = global.users.employee;
      const payload = { name: firstName, email };

      assert.isRejected(controller.default(network, payload));
    });

    it('should fail when team doesn\'t belongs to the network', async () => {
      // TODO
    });

    it('should add to the network as admin', async () => {
      const { firstName, email } = existingUser;
      const payload = { name: firstName, email, isAdmin: true };
      const actual = await controller.default(network, payload);

      assert.equal(actual.Networks[0].NetworkUser.roleType, 'ADMIN');
    });

    it('should add to the network as employee', async () => {
      const { firstName, email } = existingUser;
      const payload = { name: firstName, email };
      const actual = await controller.default(network, payload);

      assert.equal(actual.Networks[0].id, network.id);
      assert.equal(actual.Networks[0].NetworkUser.roleType, 'EMPLOYEE');
    });

    it('should add to the team', async () => {
      const { firstName, email } = existingUser;
      const payload = { name: firstName, email, teamId: team.id };
      const actual = await controller.default(network, payload);

      assert.isDefined(find(actual.Teams, { id: team.id }));
    });
  });

  describe('New User', () => {
    const payload = { name: 'Cool User', email: 'test-user@foo.com' };

    afterEach(() => findUserByEmail(payload.email).then(u => u.destroy()));

    it('should create when not exists', async () => {
      const actual = await controller.default(network, payload);

      assert.equal(actual.firstName, payload.name);
      assert.equal(actual.username, payload.email);
      assert.equal(actual.email, payload.email);
    });

    it('should add to the network as admin', async () => {
      const actual = await controller.default(network, { ...payload, isAdmin: true });

      assert.equal(actual.Networks[0].id, network.id);
      assert.equal(actual.Networks[0].NetworkUser.roleType, 'ADMIN');
    });

    it('should add to the network as employee', async () => {
      const actual = await controller.default(network, payload);

      assert.equal(actual.Networks[0].id, network.id);
      assert.equal(actual.Networks[0].NetworkUser.roleType, 'EMPLOYEE');
    });

    it('should add to the team', async () => {
      const actual = await controller.default(network, { ...payload, teamId: team.id });

      assert.isDefined(find(actual.Teams, { id: team.id }));
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
      const { firstName, email } = deletedUser;
      const payload = { name: firstName, email, isAdmin: true };
      const actual = await controller.default(network, payload);

      assert.equal(actual.Networks[0].NetworkUser.roleType, 'ADMIN');
      assert.equal(actual.Networks[0].NetworkUser.deletedAt, null);
    });

    it('should add to the network as employee', async () => {
      const { firstName, email } = deletedUser;
      const payload = { name: firstName, email };
      const actual = await controller.default(network, payload);

      assert.equal(actual.Networks[0].id, network.id);
      assert.equal(actual.Networks[0].NetworkUser.roleType, 'EMPLOYEE');
      assert.equal(actual.Networks[0].NetworkUser.deletedAt, null);
    });

    it('should add to the team', async () => {
      const { firstName, email } = deletedUser;
      const payload = { name: firstName, email, teamId: team.id };
      const actual = await controller.default(network, payload);

      assert.isDefined(find(actual.Teams, { id: team.id }));
    });
  });
});
