import { assert } from 'chai';
import { getRequest } from '../../../shared/test-utils/request';

describe('Handler: View my profile', () => {
  it('should return correct user object for default network', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/users/me`;
    const { result: { data } } = await getRequest(endpoint, global.server, global.tokens.employee);

    assert.equal(data.id, global.users.employee.id);
    assert.equal(data.username, global.users.employee.username);
    assert.equal(data.first_name, global.users.employee.firstName);
    assert.equal(data.last_name, global.users.employee.lastName);
    assert.equal(data.phone_num, global.users.employee.phoneNum);
    assert.equal(data.email, global.users.employee.email);
    assert.equal(data.date_of_birth, global.users.employee.dateOfBirth);
    assert.equal(data.integration_auth, false);
    assert.equal(data.role_type, 'EMPLOYEE');
    assert.equal(data.address, global.users.employee.address);
  });

  it('should return correct user object for network without integration', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/users/me`;
    const { result: { data } } = await getRequest(endpoint);

    assert.equal(data.id, global.users.admin.id);
    assert.equal(data.username, global.users.admin.username);
    assert.equal(data.first_name, global.users.admin.firstName);
    assert.equal(data.last_name, global.users.admin.lastName);
    assert.equal(data.phone_num, global.users.admin.phoneNum);
    assert.equal(data.email, global.users.admin.email);
    assert.equal(data.date_of_birth, global.users.admin.dateOfBirth);
    assert.equal(data.integration_auth, false);
    assert.equal(data.role_type, 'ADMIN');
    assert.equal(data.address, global.users.admin.address);
  });

  it('should return correct user object for network with integration', async () => {
    const endpoint = `/v2/networks/${global.networks.pmt.id}/users/me`;
    const { result: { data } } = await getRequest(endpoint);

    assert.equal(data.id, global.users.admin.id);
    assert.equal(data.username, global.users.admin.username);
    assert.equal(data.first_name, global.users.admin.firstName);
    assert.equal(data.last_name, global.users.admin.lastName);
    assert.equal(data.phone_num, global.users.admin.phoneNum);
    assert.equal(data.email, global.users.admin.email);
    assert.equal(data.date_of_birth, global.users.admin.dateOfBirth);
    assert.equal(data.integration_auth, true);
    assert.equal(data.role_type, 'ADMIN');
    assert.equal(data.address, global.users.admin.address);
  });
});
