import { assert } from 'chai';
import { findUserByEmail } from 'common/repositories/user';
import { postRequest } from 'common/test-utils/request';

describe('Invite user', () => {
  after(async () => {
    const admin = await findUserByEmail('admin@baz.com');
    const employee = await findUserByEmail('employee@baz.com');

    return Promise.all([admin.destroy(), employee.destroy()]);
  });

  const user = {
    first_name: 'Foo',
    last_name: 'Baz',
  };

  it('should add to the network as admin', async () => {
    const payload = {
      ...user,
      email: 'admin@baz.com',
      role_type: 'admin',
    };

    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/users`;
    const { result, statusCode } = await postRequest(endpoint, payload);

    assert.equal(statusCode, 200);
    assert.equal(result.data.email, payload.email);
    assert.equal(result.data.role_type, payload.role_type.toUpperCase());
  });

  it('should add to the network as employee', async () => {
    const payload = {
      ...user,
      email: 'employee@baz.com',
      role_type: 'employee',
    };

    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/users`;
    const { result, statusCode } = await postRequest(endpoint, payload);

    assert.equal(statusCode, 200);
    assert.equal(result.data.username, payload.email);
    assert.equal(result.data.email, payload.email);
    assert.equal(result.data.role_type, payload.role_type.toUpperCase());
  });

  it('should fail when user belongs to the network', async () => {
    const payload = {
      ...user,
      role_type: 'admin',
    };

    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/users`;
    const { statusCode } = await postRequest(endpoint, payload);

    assert.equal(statusCode, 422);
  });
});
