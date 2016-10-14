import { assert } from 'chai';
import sinon from 'sinon';
import Promise from 'bluebird';
import nock from 'nock';
import { flatten, sortBy, partialRight, flow } from 'lodash';
import { getRequest } from '../../../shared/test-utils/request';
import * as mailer from '../../../shared/services/mailer';
import * as stubs from '../../../shared/test-utils/stubs';
import * as userRepo from '../../core/repositories/user';
import * as integrationRepo from '../../core/repositories/integration';
import * as networkRepo from '../../core/repositories/network';
import { UserRoles } from '../../../shared/services/permission';

describe('Handler: Bulk invite users', () => {
  const sortByUsername = partialRight(sortBy, 'username');
  const sortImportedUsers = flow(flatten, sortByUsername);
  const toBeImportedUsers = stubs.import_users;
  const pristineNetwork = stubs.pristine_network;
  const admin = stubs.pristine_admin;
  let createdUsers;

  const importUser = async (user) => {
    const roleType = user.isAdmin ? UserRoles.ADMIN : UserRoles.EMPLOYEE;
    const employee = await userRepo.createUser(user);

    return networkRepo.addUser({
      userId: employee.id, networkId: global.networks.pmt.id, roleType });
  };

  describe('Happy path', () => {
    before(async () => {
      const ENDPOINT = '/users';
      nock(global.networks.pmt.externalId)
        .get(ENDPOINT)
        .reply('200', stubs.users_200);

      createdUsers = sortImportedUsers(await Promise.map(toBeImportedUsers, importUser));
    });

    after(() => {
      mailer.send.restore();
      sinon.stub(mailer, 'send').returns(null);

      return Promise.all(createdUsers.map(employee => userRepo.deleteById(employee.id)));
    });

    it('should add to the network as admin', async () => {
      const endpoint = `/v2/networks/${global.networks.pmt.id}/users/bulk_invite`;
      const { statusCode } = await getRequest(endpoint);

      assert.equal(statusCode, 200);
      assert.equal(mailer.send.called, true);
    });
  });

  describe('Faulty path', () => {
    let integration;
    let adminUser;
    let network;

    before(async () => {
      adminUser = await userRepo.createUser({ ...admin });
      integration = await integrationRepo.createIntegration({
        name: pristineNetwork.integrationName,
        token: 'footoken',
      });
      network = await networkRepo.createNetwork(
        adminUser.id,
        pristineNetwork.name,
        pristineNetwork.networkId);

      createdUsers = sortImportedUsers(await Promise.map(toBeImportedUsers, importUser));
    });

    after(async () => {
      await Promise.all([
        integration.destroy(),
        userRepo.deleteById(adminUser.id),
      ]);

      return networkRepo.deleteById(network.id);
    });

    it('should fail because of bad network access', async () => {
      const endpoint = `/v2/networks/${network.id}/users/bulk_invite`;
      const { statusCode } = await getRequest(endpoint);

      assert.equal(statusCode, 403);
    });
  });
});
