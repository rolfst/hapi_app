const { assert } = require('chai');
const R = require('ramda');
const testHelpers = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');
const { ERoleTypes } = require('../../core/definitions');
const organisationRepo = require('../../core/repositories/organisation');

describe('Handler: Invite user', () => {
  let admin;
  let network;
  let organisation;

  let endpoint;

  const userFixtureA = {
    first_name: 'Foo',
    last_name: 'Baz',
    email: 'admin@baz.com',
  };

  const userFixtureB = {
    first_name: 'Foo2',
    last_name: 'Baz2',
    email: 'admin2@baz2.com',
  };

  const userFixtureC = {
    first_name: 'Foo3',
    last_name: 'Baz3',
    email: 'admin3@baz3.com',
  };

  before(async () => {
    [organisation, admin] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser({
        username: 'admin@flex-appeal.nl', password: 'foo' }),
    ]);

    await testHelpers.addUserToOrganisation(admin.id, organisation.id, ERoleTypes.ADMIN);

    network = await testHelpers.createNetwork({ organisationId: organisation.id, userId: admin.id, name: 'flexAppeal' });

    endpoint = `/v2/networks/${network.id}/users`;
  });

  after(() => testHelpers.cleanAll());

  it('should add to the network as admin', async () => {
    const payload = R.merge(
      userFixtureA,
      { role_type: 'admin' }
    );

    const { result, statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.email, payload.email);
    assert.equal(result.data.role_type, payload.role_type.toUpperCase());
  });

  it('should add to the network as employee', async () => {
    const payload = R.merge(
      userFixtureB,
      { role_type: 'employee' }
    );

    const { result, statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.username, payload.email);
    assert.equal(result.data.email, payload.email);
    assert.equal(result.data.role_type, payload.role_type.toUpperCase());
  });

  it('should fail when user belongs to the network', async () => {
    const payload = R.merge(userFixtureA, { role_type: 'admin' });

    const { statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 403);
  });

  it('should add user to organistion as employee when not exist', async () => {
    const payload = R.merge(userFixtureC, { role_type: 'admin' });

    const { statusCode, result } = await postRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 200);

    const organisationUser = await organisationRepo.getPivot(result.data.id, organisation.id);

    assert.isNotNull(organisationUser);
    assert.equal(organisationUser.roleType, ERoleTypes.EMPLOYEE);
  });
});
