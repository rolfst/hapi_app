import { assert } from 'chai';
import sinon from 'sinon';
import Promise from 'bluebird';
import nock from 'nock';
import { flatten, find, sortBy, partialRight, flow, map } from 'lodash';
import { getRequest } from '../../../shared/test-utils/request';
import * as mailer from '../../../shared/services/mailer';
import * as stubs from '../../../shared/test-utils/stubs';
import * as userRepo from '../../core/repositories/user';
import * as integrationRepo from '../../core/repositories/integration';
import * as networkRepo from '../../core/repositories/network';
import { UserRoles } from '../../../shared/services/permission';

describe('Handler: Bulk invite users', () => {
  let createdUsers;
  const sortByUsername = partialRight(sortBy, 'username');
  const sortImportedUsers = flow(flatten, sortByUsername);
  const toBeImportedUsers = stubs.import_users;
  const pristineNetwork = stubs.pristine_network;

  // FIXME: Logic should be moved to service or repository
  const importUser = async (user) => {
    const roleType = user.isAdmin ? UserRoles.ADMIN : UserRoles.EMPLOYEE;
    const employee = await userRepo.createUser({ ...user, password: 'fakepassword' });

    await networkRepo.addUser({
      userId: employee.id, networkId: global.networks.pmt.id, roleType });

    return employee;
  };

  before(async () => {
    createdUsers = sortImportedUsers(await Promise.map(toBeImportedUsers, importUser));
  });

  after(() => Promise.all(map(map(createdUsers, 'id'), userRepo.deleteById)));

  describe('Happy path', () => {
    before(async () => {
      nock(global.networks.pmt.externalId)
        .get('/users')
        .reply('200', stubs.users_200);

      sinon.stub(mailer, 'send').returns(null);
    });

    after(() => {
      mailer.send.restore();
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

    after(async () => Promise.all([
      integration.destroy(),
      networkRepo.deleteById(network.id),
    ]));

    it('should fail because of bad network access', async () => {
      const endpoint = `/v2/networks/${network.id}/users/bulk_invite`;
      const { statusCode } = await getRequest(endpoint);

      assert.equal(statusCode, 403);
    });
  });
});
