const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const { getRequest, putRequest } = require('../../../shared/test-utils/request');

describe('Handler: update my profile', () => {
  let employee;
  let network;

  before(async () => {
    const admin = await testHelpers.createUser({ password: 'pw' });
    employee = await testHelpers.createUser({ password: 'baz' });

    network = await testHelpers.createNetwork({ userId: admin.id });
    await testHelpers.addUserToNetwork({
      userId: employee.id, networkId: network.id, roleType: 'EMPLOYEE' });
  });

  after(() => testHelpers.cleanAll());

  it('should return an updated user', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me`;
    const payload = { first_name: 'My new first name' };
    const { result: { data } } = await putRequest(
      endpoint, payload, employee.token);

    assert.equal(data.id, employee.id);
    assert.equal(data.username, employee.username);
    assert.equal(data.first_name, payload.first_name);
    assert.equal(data.last_name, employee.lastName);
    assert.equal(data.phone_num, employee.phoneNum);
    assert.equal(data.email, employee.email);
    assert.equal(data.date_of_birth, employee.dateOfBirth);
    assert.equal(data.integration_auth, false);
    assert.equal(data.player_id, null);
    assert.equal(data.role_type, 'EMPLOYEE');
  });

  it('should return correct attributes in GET call', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me`;
    const { result: { data } } = await getRequest(
      endpoint, employee.token);

    assert.equal(data.id, employee.id);
    assert.equal(data.username, employee.username);
    assert.equal(data.first_name, 'My new first name');
    assert.equal(data.last_name, employee.lastName);
    assert.equal(data.phone_num, employee.phoneNum);
    assert.equal(data.email, employee.email);
    assert.equal(data.date_of_birth, employee.dateOfBirth);
    assert.equal(data.integration_auth, false);
    assert.equal(data.role_type, 'EMPLOYEE');
  });

  it('should return 422 when trying to update the id value', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me`;
    const { statusCode } = await putRequest(
      endpoint, { id: '0002222' }, employee.token);

    assert.equal(statusCode, 422);
  });

  it('should return an updated playerId', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me`;
    const payload = { player_id: 'playerId' };
    const { result: { data } } = await putRequest(
      endpoint, payload, employee.token);

    assert.equal(data.player_id, 'playerId');
  });

  it('should return an original playerId', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me`;
    const payload = { player_id: 'playerId' };
    await putRequest(endpoint, payload, employee.token);
    const { result: { data } } = await putRequest(
      endpoint, { player_id: 'updated_PlayerId' }, employee.token);

    assert.equal(data.player_id, 'playerId');
  });
});
