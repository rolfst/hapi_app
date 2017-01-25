import { assert } from 'chai';
import * as testHelpers from '../../../shared/test-utils/helpers';
import { postRequest } from '../../../shared/test-utils/request';

describe('Handler: Invite user', () => {
  let network;
  let adminToken;

  before(async () => {
    const admin = await testHelpers.createUser({
      username: 'admin@flex-appeal.nl', password: 'foo' });

    const adminTokens = await testHelpers.getLoginToken({
      username: admin.username, password: 'foo' });

    adminToken = adminTokens.tokens.access_token;
    network = await testHelpers.createNetwork({ userId: admin.id });
  });

  after(() => testHelpers.cleanAll());

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

    const endpoint = `/v2/networks/${network.id}/users`;
    const { result, statusCode } = await postRequest(endpoint, payload, adminToken);

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

    const endpoint = `/v2/networks/${network.id}/users`;
    const { result, statusCode } = await postRequest(endpoint, payload, adminToken);

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

    const endpoint = `/v2/networks/${network.id}/users`;
    const { statusCode } = await postRequest(endpoint, payload, adminToken);

    assert.equal(statusCode, 422);
  });
});
