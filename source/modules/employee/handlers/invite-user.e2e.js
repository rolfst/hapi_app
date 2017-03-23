const { assert } = require('chai');
const R = require('ramda');
const testHelpers = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');

describe('Handler: Invite user', () => {
  let admin;
  let network;

  before(async () => {
    admin = await testHelpers.createUser({
      username: 'admin@flex-appeal.nl', password: 'foo' });

    network = await testHelpers.createNetwork({ userId: admin.id, name: 'flexAppeal' });
  });

  after(() => testHelpers.cleanAll());

  const user = {
    first_name: 'Foo',
    last_name: 'Baz',
  };

  it('should add to the network as admin', async () => {
    const payload = R.merge(
      user,
      {
        email: 'admin@baz.com',
        role_type: 'admin',
      }
    );

    const endpoint = `/v2/networks/${network.id}/users`;
    const { result, statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.email, payload.email);
    assert.equal(result.data.role_type, payload.role_type.toUpperCase());
  });

  it('should add to the network as employee', async () => {
    const payload = R.merge(
      user,
      {
        email: 'employee@baz.com',
        role_type: 'employee',
      }
    );

    const endpoint = `/v2/networks/${network.id}/users`;
    const { result, statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.username, payload.email);
    assert.equal(result.data.email, payload.email);
    assert.equal(result.data.role_type, payload.role_type.toUpperCase());
  });

  it('should fail when user belongs to the network', async () => {
    const payload = R.merge(user, { role_type: 'admin' });

    const endpoint = `/v2/networks/${network.id}/users`;
    const { statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 422);
  });
});
