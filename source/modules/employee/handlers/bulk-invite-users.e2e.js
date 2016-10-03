import { assert } from 'chai';
import sinon from 'sinon';
import Promise from 'bluebird';
import { flatten, sortBy, partialRight, flow } from 'lodash';
import { getRequest } from '../../../shared/test-utils/request';
import * as mailer from '../../../shared/services/mailer';
import * as stubs from '../../../shared/test-utils/stubs';
import * as userRepo from '../../../shared/repositories/user';
import * as integrationRepo from '../../../shared/repositories/integration';
import * as networkRepo from '../../../shared/repositories/network';
import addedToNetworkMail from '../../../shared/mails/added-to-network';
import { UserRoles } from '../../../shared/services/permission';

const sortByUsername = partialRight(sortBy, 'username');
const sortImportedUsers = flow(flatten, sortByUsername);
const importUser = async (user) => {
  const roleType = user.isAdmin ? UserRoles.ADMIN : UserRoles.EMPLOYEE;
  const employee = await userRepo.createUser(user);

  return userRepo.addUserToNetwork(employee, global.networks.pmt, { roleType });
};

describe('Handler: Bulk invite users', () => {
  const toBeImportedUsers = stubs.import_users;
  const pristineNetwork = stubs.pristine_network;
  const admin = stubs.pristine_admin;
  let createdUsers;

  describe('happy path', () => {
    before(async () => {
      createdUsers = sortImportedUsers(await Promise.map(toBeImportedUsers, importUser));
    });

    after(() => {
      mailer.send.restore();
      sinon.stub(mailer, 'send').returns(null);

      return Promise.all(createdUsers.map(employee => employee.destroy()));
    });

    it('should add to the network as admin', async () => {
      const endpoint = `/v2/networks/${global.networks.pmt.id}/users/bulk_invite`;
      const { result, statusCode } = await getRequest(endpoint);
      const mailConfiguration = addedToNetworkMail(global.networks.pmt, createdUsers[0]);

      assert.equal(statusCode, 200);
      assert.equal(result.data[0].email, createdUsers[0].email);
      assert.equal(mailer.send.calledWithMatch(mailConfiguration), true);
    });
  });

  describe('faulty path', () => {
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

    after(() => {
      return Promise.all([
        network.destroy(),
        integration.destroy(),
        adminUser.destroy(),
      ]);
    });

    it('should fail because of bad network access', async () => {
      const endpoint = `/v2/networks/${network.id}/users/bulk_invite`;
      const { statusCode } = await getRequest(endpoint);

      assert.equal(statusCode, 403);
    });
  });
});
