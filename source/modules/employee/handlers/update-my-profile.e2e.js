import { assert } from 'chai';
import { getRequest, putRequest } from '../../../shared/test-utils/request';
import * as userRepo from '../../core/repositories/user';

describe('Handler: update my profile', () => {
  after(() => userRepo.updateUser(global.users.employee.id, { firstName: 'John' }));

  it('should return an updated user', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/users/me`;
    const payload = { first_name: 'My new first name' };
    const { result: { data } } = await putRequest(
      endpoint, payload, global.server, global.tokens.employee);

    assert.equal(data.id, global.users.employee.id);
    assert.equal(data.username, global.users.employee.username);
    assert.equal(data.first_name, payload.first_name);
    assert.equal(data.last_name, global.users.employee.lastName);
    assert.equal(data.phone_num, global.users.employee.phoneNum);
    assert.equal(data.email, global.users.employee.email);
    assert.equal(data.date_of_birth, global.users.employee.dateOfBirth);
    assert.equal(data.integration_auth, false);
    assert.equal(data.role_type, 'EMPLOYEE');
  });

  it('should return correct attributes in GET call', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/users/me`;
    const { result: { data } } = await getRequest(
      endpoint, global.server, global.tokens.employee);

    assert.equal(data.id, global.users.employee.id);
    assert.equal(data.username, global.users.employee.username);
    assert.equal(data.first_name, 'My new first name');
    assert.equal(data.last_name, global.users.employee.lastName);
    assert.equal(data.phone_num, global.users.employee.phoneNum);
    assert.equal(data.email, global.users.employee.email);
    assert.equal(data.date_of_birth, global.users.employee.dateOfBirth);
    assert.equal(data.integration_auth, false);
    assert.equal(data.role_type, 'EMPLOYEE');
  });

  it('should return 422 when trying to update the id value', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/users/me`;
    const { statusCode } = await putRequest(
      endpoint, { id: '0002222' }, global.server, global.tokens.employee);

    assert.equal(statusCode, 422);
  });
});
