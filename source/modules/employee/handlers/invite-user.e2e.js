import { assert } from 'chai';
import { postRequest } from '../../../shared/test-utils/request';
import * as userRepo from '../../core/repositories/user';

describe('Handler: Invite user', () => {
  after(async () => {
    const admin = await userRepo.findUserBy({ email: 'admin@baz.com' });
    const employee = await userRepo.findUserBy({ email: 'employee@baz.com' });

    return Promise.all([
      userRepo.deleteById(admin.id),
      userRepo.deleteById(employee.id),
    ]);
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
