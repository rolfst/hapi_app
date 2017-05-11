const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');

describe('Handler: View my profile', () => {
  let employee;
  let employeeToken;
  let admin;
  let adminToken;
  let network;
  let networkWithIntegration;

  before(async () => {
    admin = await testHelpers.createUser({ password: 'foo' });
    employee = await testHelpers.createUser({ password: 'baz' });
    const [employeeTokens, adminTokens] = await Promise.all([
      testHelpers.getLoginToken({ username: employee.username, password: 'baz' }),
      testHelpers.getLoginToken({ username: admin.username, password: 'foo' }),
    ]);

    employeeToken = employeeTokens.tokens.access_token;
    adminToken = adminTokens.tokens.access_token;

    [network, networkWithIntegration] = await Promise.all([
      testHelpers.createNetwork({ userId: admin.id }),
      testHelpers.createNetworkWithIntegration({
        userToken: 'foo', userExternalId: '341', userId: admin.id }),
    ]);

    await testHelpers.addUserToNetwork({
      userId: employee.id, networkId: network.id, roleType: 'EMPLOYEE' });

    await testHelpers.addUserToNetwork({
      userId: admin.id, networkId: network.id, roleType: 'ADMIN' });
  });

  after(() => testHelpers.cleanAll());

  it('should return correct user object for default network', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me`;
    const { result: { data } } = await getRequest(endpoint, employeeToken);

    assert.equal(data.id, employee.id);
    assert.equal(data.username, employee.username);
    assert.equal(data.first_name, employee.firstName);
    assert.equal(data.last_name, employee.lastName);
    assert.equal(data.full_name, employee.fullName);
    assert.equal(data.phone_num, employee.phoneNum);
    assert.equal(data.email, employee.email);
    assert.equal(data.date_of_birth, employee.dateOfBirth);
    assert.equal(data.integration_auth, false);
    assert.equal(data.role_type, 'EMPLOYEE');
    assert.property(data, 'deleted_at');
    assert.property(data, 'invited_at');
    assert.property(data, 'last_active');
    assert.equal(data.address, employee.address);
  });

  it('should return correct user object for network without integration', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me`;
    const { result: { data } } = await getRequest(endpoint, adminToken);

    assert.equal(data.id, admin.id);
    assert.equal(data.username, admin.username);
    assert.equal(data.first_name, admin.firstName);
    assert.equal(data.last_name, admin.lastName);
    assert.equal(data.full_name, admin.fullName);
    assert.equal(data.phone_num, admin.phoneNum);
    assert.equal(data.email, admin.email);
    assert.equal(data.date_of_birth, admin.dateOfBirth);
    assert.equal(data.integration_auth, false);
    assert.equal(data.role_type, 'ADMIN');
    assert.property(data, 'deleted_at');
    assert.property(data, 'invited_at');
    assert.property(data, 'last_active');
    assert.equal(data.address, admin.address);
  });

  it('should return correct user object for network with integration', async () => {
    const endpoint = `/v2/networks/${networkWithIntegration.network.id}/users/me`;
    const { result: { data } } = await getRequest(endpoint, adminToken);

    assert.equal(data.id, admin.id);
    assert.equal(data.username, admin.username);
    assert.equal(data.first_name, admin.firstName);
    assert.equal(data.last_name, admin.lastName);
    assert.equal(data.full_name, admin.fullName);
    assert.equal(data.phone_num, admin.phoneNum);
    assert.equal(data.email, admin.email);
    assert.equal(data.date_of_birth, admin.dateOfBirth);
    assert.equal(data.integration_auth, true);
    assert.equal(data.role_type, 'ADMIN');
    assert.property(data, 'deleted_at');
    assert.property(data, 'invited_at');
    assert.property(data, 'last_active');
    assert.equal(data.address, admin.address);
  });
});
