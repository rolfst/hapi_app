const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const organisationService = require('../services/organisation');
const organisationRepo = require('../repositories/organisation');
const { getRequest } = require('../../../shared/test-utils/request');

describe('Handler: Users in organisation', () => {
  let organisationA;
  let organisationB;
  let users;

  before(async () => {
    [organisationA, organisationB, ...users] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createOrganisation(),
      testHelpers.createUser({ firstName: 'test', lastName: 'test' }),
      testHelpers.createUser({ firstName: 'pelt', lastName: 'spellen' }),
      testHelpers.createUser({ firstName: 'pelt', lastName: 'spellen' }),
      testHelpers.createUser(),
    ]);

    const [networkA, networkB] = await Promise.all([
      testHelpers.createNetwork({ userId: users[0].id }),
      testHelpers.createNetwork({ userId: users[1].id }),
    ]);

    await Promise.all([
      organisationService.attachNetwork({
        networkId: networkA.id, organisationId: organisationA.id }),
      organisationService.attachNetwork({
        networkId: networkB.id, organisationId: organisationA.id }),
      organisationRepo.addUser(users[0].id, organisationA.id, 'ADMIN'),
      organisationRepo.addUser(users[2].id, organisationA.id, 'ADMIN'),
      organisationRepo.addUser(users[3].id, organisationA.id, 'ADMIN'),
      organisationRepo.addUser(users[1].id, organisationB.id, 'ADMIN'),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should return users for organisation', async () => {
    const endpoint = `/v2/organisations/${organisationA.id}/users`;
    const { statusCode, result } = await getRequest(endpoint, users[0].token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 3);

    const actual = result.data[0];
    assert.property(actual, 'id');

    assert.property(actual, 'first_name');
    assert.property(actual, 'last_name');
    assert.property(actual, 'full_name');
    assert.property(actual, 'phone_num');
    assert.property(actual, 'type');
    assert.property(actual, 'id');
    assert.property(actual, 'username');
    assert.property(actual, 'email');
    assert.property(actual, 'external_id');
    assert.property(actual, 'integration_auth');
    assert.property(actual, 'role_type');
    assert.property(actual, 'profile_img');
    assert.property(actual, 'date_of_birth');
    assert.property(actual, 'created_at');
    assert.property(actual, 'last_login');
    assert.property(actual, 'invited_at');
    assert.property(actual, 'deleted_at');
  });

  it('should return a users count for organisation the meta', async () => {
    const endpoint = `/v2/organisations/${organisationA.id}/users`;
    const { result: { meta } } = await getRequest(endpoint, users[0].token);

    assert.equal(meta.pagination.total_count, 3);
    assert.equal(meta.pagination.offset, 0);
    assert.equal(meta.pagination.limit, 20);

    assert.property(meta, 'counts');
    assert.property(meta.counts, 'total');
    assert.property(meta.counts, 'active');
    assert.property(meta.counts, 'inactive');
    assert.property(meta.counts, 'not_registered');
  });

  it('should return a limited set of users for organisation', async () => {
    const endpoint = `/v2/organisations/${organisationA.id}/users?limit=1`;
    const { statusCode, result } = await getRequest(endpoint, users[0].token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 1);
  });

  it('should return users for different organinsation', async () => {
    const endpoint = `/v2/organisations/${organisationB.id}/users`;
    const { statusCode, result } = await getRequest(endpoint, users[1].token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 1);
  });

  it('should not return any users for different organisation', async () => {
    const endpoint = `/v2/organisations/${organisationB.id}/users`;
    const { statusCode, result } = await getRequest(endpoint, users[0].token);

    assert.equal(statusCode, 403);
    assert.equal(result.error_code, '403');
  });

  it(`should return a set of users for organisation where mutliple organisations have a member with the same name,
    based on a query`,
    async () => {
      const endpoint = `/v2/organisations/${organisationA.id}/users?q=pel`;
      const { statusCode, result } = await getRequest(endpoint, users[0].token);

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 1);
    });

  it('should return a set of users for organisation based on a query', async () => {
    const endpoint = `/v2/organisations/${organisationA.id}/users?q=test`;
    const { statusCode, result } = await getRequest(endpoint, users[0].token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 1);

    const actual = result.data[0];

    assert.property(actual, 'id');
    assert.property(actual, 'first_name');
    assert.property(actual, 'last_name');
    assert.property(actual, 'full_name');
    assert.property(actual, 'phone_num');
    assert.property(actual, 'type');
    assert.property(actual, 'id');
    assert.property(actual, 'username');
    assert.property(actual, 'email');
    assert.property(actual, 'external_id');
    assert.property(actual, 'integration_auth');
    assert.property(actual, 'role_type');
    assert.property(actual, 'profile_img');
    assert.property(actual, 'date_of_birth');
    assert.property(actual, 'created_at');
    assert.property(actual, 'last_login');
    assert.property(actual, 'invited_at');
    assert.property(actual, 'deleted_at');
  });
});
