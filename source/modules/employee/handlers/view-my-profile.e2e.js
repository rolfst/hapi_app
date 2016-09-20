import { assert } from 'chai';
import { getRequest } from 'shared/test-utils/request';

describe('Authenticate', () => {
  beforeEach(() => {
    global.users.employee.reload();
  });

  it('should return user object when authenticated with integration', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/users/me`;
    const { result: { data } } = await getRequest(endpoint, global.server, global.tokens.employee);

    assert.equal(data.id, global.users.employee.id);
    assert.equal(data.username, global.users.employee.username);
    assert.equal(data.first_name, global.users.employee.firstName);
    assert.equal(data.last_name, global.users.employee.lastName);
    assert.equal(data.phone_num, global.users.employee.phoneNum);
    assert.equal(data.email, global.users.employee.email);
    assert.equal(data.date_of_birth, global.users.employee.dateOfBirth);
    assert.equal(data.role_type, global.users.employee.roleType);
    assert.equal(data.address, global.users.employee.address);
  });
});
