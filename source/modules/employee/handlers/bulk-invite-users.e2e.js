const { assert } = require('chai');
const Promise = require('bluebird');
const sinon = require('sinon');
const { flatten, sortBy, partialRight, flow, map } = require('lodash');
const { postRequest } = require('../../../shared/test-utils/request');
const mailer = require('../../../shared/services/mailer');
const stubs = require('../../../shared/test-utils/stubs');
const { UserRoles } = require('../../../shared/services/permission');
const userService = require('../../core/services/user');
const testHelpers = require('../../../shared/test-utils/helpers');

describe('Handler: Bulk invite users', () => {
  let sandbox;
  let createdUsers;
  const sortByUsername = partialRight(sortBy, 'username');
  const sortImportedUsers = flow(flatten, sortByUsername);
  const toBeImportedUsers = stubs.import_users;

  // FIXME: Logic should be moved to service or repository
  const importUser = (networkId) => async (user) => {
    const employee = await testHelpers.createUser({ ...user, password: 'fakepassword' });

    await testHelpers.addUserToNetwork({
      networkId,
      userId: employee.id,
      roleType: user.isAdmin ? UserRoles.ADMIN : UserRoles.EMPLOYEE,
    });

    return employee;
  };

  let adminToken;
  let employee;
  let employeeToken;
  let network;

  before(async () => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(mailer, 'send');

    const admin = await testHelpers.createUser({
      username: 'admin@flex-appeal.nl', password: 'foo' });
    employee = await testHelpers.createUser({
      username: 'employee@flex-appeal.nl', password: 'baz' });

    network = await testHelpers.createNetwork({ userId: admin.id });

    [adminToken, employeeToken] = await Promise.all([
      testHelpers.getLoginToken({ username: admin.username, password: 'foo' }),
      testHelpers.getLoginToken({ username: employee.username, password: 'baz' }),
    ]);

    await Promise.all([
      testHelpers.addUserToNetwork({
        userId: employee.id, networkId: network.id, roleType: 'EMPLOYEE' }),
      testHelpers.addUserToNetwork({
        userId: admin.id, networkId: network.id, roleType: 'ADMIN' }),
    ]);

    createdUsers = sortImportedUsers(await Promise.map(toBeImportedUsers, importUser(network.id)));
  });

  after(() => {
    sandbox.restore();
    return testHelpers.cleanAll();
  });

  describe('Happy path', () => {
    it('should add to the network as admin', async () => {
      const userIds = map(createdUsers, 'id');
      const endpoint = `/v2/networks/${network.id}/users/invite`;
      const { statusCode } = await postRequest(
        endpoint, { user_ids: userIds }, adminToken.tokens.access_token);

      assert.equal(statusCode, 200);
      assert.equal(mailer.send.called, true);
    });

    it('should set invited_at value', async () => {
      const userIds = map(createdUsers, 'id');
      const endpoint = `/v2/networks/${network.id}/users/invite`;
      const { statusCode } = await postRequest(
        endpoint, { user_ids: userIds }, adminToken.tokens.access_token);
      const invitedUser = await userService.getUserWithNetworkScope({
        id: userIds[0], networkId: network.id });

      assert.equal(statusCode, 200);
      assert.isTrue(invitedUser.invitedAt !== null);
    });
  });

  describe('Faulty path', () => {
    let alternativeAdminToken;

    before(async () => {
      const alternativeAdmin = await testHelpers.createUser({
        username: 'alternativeAdmin@flex-appeal.nl', password: 'foo' });

      alternativeAdminToken = await testHelpers.getLoginToken({
        username: alternativeAdmin.username, password: 'foo' });
    });

    it('should return 403 when authenticated user is a regular user', async () => {
      await testHelpers.addUserToNetwork({
        networkId: network.id,
        userId: employee.id,
        roleType: UserRoles.EMPLOYEE,
      });

      const endpoint = `/v2/networks/${network.id}/users/invite`;
      const userIds = map(createdUsers, 'id');
      const { statusCode } = await postRequest(endpoint, {
        user_ids: userIds }, employeeToken.tokens.access_token);

      assert.equal(statusCode, 403);
    });

    it('should return 422 because of missing user_ids payload', async () => {
      const endpoint = `/v2/networks/${network.id}/users/invite`;
      const { statusCode } = await postRequest(endpoint, {}, adminToken.tokens.access_token);

      assert.equal(statusCode, 422);
    });

    it('should fail because of bad network access', async () => {
      const endpoint = `/v2/networks/${network.id}/users/invite`;
      const userIds = map(createdUsers, 'id');
      const { statusCode } = await postRequest(
        endpoint, { user_ids: userIds }, alternativeAdminToken.tokens.access_token);

      assert.equal(statusCode, 403);
    });
  });
});
