import { assert } from 'chai';
import Promise from 'bluebird';
import { flatten, find, sortBy, partialRight, flow, map } from 'lodash';
import { postRequest } from '../../../shared/test-utils/request';
import * as mailer from '../../../shared/services/mailer';
import * as stubs from '../../../shared/test-utils/stubs';
import { UserRoles } from '../../../shared/services/permission';
import * as userRepo from '../../core/repositories/user';
import * as integrationRepo from '../../core/repositories/integration';
import * as networkRepo from '../../core/repositories/network';
import * as networkService from '../../core/services/network';
import * as userService from '../../core/services/user';

describe('Handler: Bulk invite users', () => {
  let createdUsers;
  const sortByUsername = partialRight(sortBy, 'username');
  const sortImportedUsers = flow(flatten, sortByUsername);
  const toBeImportedUsers = stubs.import_users;
  const pristineNetwork = stubs.pristine_network;

  // FIXME: Logic should be moved to service or repository
  const importUser = async (user) => {
    const networkId = user.networkId ? user.networkId : global.networks.pmt.id;
    const roleType = user.isAdmin ? UserRoles.ADMIN : UserRoles.EMPLOYEE;
    const employee = await userRepo.createUser({ ...user, password: 'fakepassword' });

    await networkRepo.addUser({
      userId: employee.id, networkId, roleType });

    return employee;
  };

  before(async () => {
    createdUsers = sortImportedUsers(await Promise.map(toBeImportedUsers, importUser));
  });

  after(() => Promise.map(map(createdUsers, 'id'), userRepo.deleteById));

  describe('Happy path', () => {
    it('should add to the network as admin', async () => {
      const userIds = map(createdUsers, 'id');
      const endpoint = `/v2/networks/${global.networks.pmt.id}/users/invite`;
      const { statusCode } = await postRequest(endpoint, { user_ids: userIds });

      assert.equal(statusCode, 200);
      assert.equal(mailer.send.called, true);
    });

    it('should set invited_at value', async () => {
      const userIds = map(createdUsers, 'id');
      const endpoint = `/v2/networks/${global.networks.pmt.id}/users/invite`;
      const { statusCode } = await postRequest(endpoint, { user_ids: userIds });
      const invitedUser = await userService.getUserWithNetworkScope({
        id: userIds[0], networkId: global.networks.pmt.id });

      assert.equal(statusCode, 200);
      assert.isTrue(invitedUser.invitedAt !== null);
    });
  });

  describe('Faulty path', () => {
    let integration;
    let network;

    before(async () => {
      const adminUser = find(createdUsers, { username: stubs.pristine_admin.username });

      integration = await integrationRepo.createIntegration({
        name: pristineNetwork.integrationName,
        token: 'footoken',
      });

      network = await networkRepo.createNetwork(
        adminUser.id, pristineNetwork.name, pristineNetwork.networkId);
    });

    after(async () => {
      return Promise.all([
        integration.destroy(),
        networkRepo.deleteById(network.id),
      ]);
    });

    it('should only process user ids that belong to the network', async () => {
      const userIds = map(createdUsers, 'id');
      const endpoint = `/v2/networks/${global.networks.pmt.id}/users/invite`;
      const { statusCode } = await postRequest(endpoint, { user_ids: userIds });
      const invitedUser = await userService.getUserWithNetworkScope({
        id: userIds[0], networkId: global.networks.pmt.id });
      const unlinkedUser = await userService.getUserWithNetworkScope({
        id: global.users.employee.id, networkId: global.networks.flexAppeal.id });

      assert.equal(statusCode, 200);
      assert.isTrue(invitedUser.invitedAt !== null);
      assert.equal(unlinkedUser.invitedAt, null);
    });

    it('should return 403 when authenticated user is a regular user', async () => {
      await networkService.addUserToNetwork({
        networkId: network.id,
        userId: global.users.employee.id,
        roleType: UserRoles.EMPLOYEE,
      });

      const endpoint = `/v2/networks/${network.id}/users/invite`;
      const userIds = map(createdUsers, 'id');
      const { statusCode } = await postRequest(endpoint, {
        user_ids: userIds }, global.server, global.users.employee.token);

      assert.equal(statusCode, 403);
    });

    it('should return 422 because of missing user_ids payload', async () => {
      const endpoint = `/v2/networks/${network.id}/users/invite`;
      const { statusCode } = await postRequest(endpoint);

      assert.equal(statusCode, 422);
    });

    it('should fail because of bad network access', async () => {
      const endpoint = `/v2/networks/${network.id}/users/invite`;
      const userIds = map(createdUsers, 'id');
      const { statusCode } = await postRequest(endpoint, { user_ids: userIds });

      assert.equal(statusCode, 403);
    });
  });
});
