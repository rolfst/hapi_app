const { assert } = require('chai');
const moment = require('moment');
const testHelpers = require('../../../shared/test-utils/helpers');
const organisationService = require('../services/organisation');
const organisationRepo = require('../repositories/organisation');
const { getRequest } = require('../../../shared/test-utils/request');
const { ESEARCH_SELECTORS } = require('../definitions');

describe('Handler: Users in organisation', () => {
  let organisationA;
  let organisationB;
  let users;

  before(async () => {
    [organisationA, organisationB, ...users] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createOrganisation(),
      testHelpers.createUser({ firstName: 'test', lastName: 'trial' }),
      testHelpers.createUser({ firstName: 'taal', lastName: 'spellen' }),
      testHelpers.createUser({ firstName: 'pelt', lastName: 'spellen' }),
      testHelpers.createUser({ firstName: 'Jean-Claude', lastName: 'van Damme' }),
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
      organisationRepo.addUser(users[4].id, organisationA.id),
    ]);
    await Promise.all([
      organisationRepo.updateUser(users[4].id, organisationA.id, { lastActive: moment() }),
      organisationRepo.updateUser(users[3].id, organisationA.id, { lastActive: moment().subtract('month', 1) }),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should return users for organisation', async () => {
    const endpoint = `/v2/organisations/${organisationA.id}/users`;
    const { statusCode, result } = await getRequest(endpoint, users[0].token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 4);

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
    assert.isString(actual.created_at);
    assert.isString(actual.updated_at);
    assert.property(actual, 'last_login');
    assert.property(actual, 'invited_at');
    assert.property(actual, 'deleted_at');
    assert.property(actual, 'last_active');
  });

  it('should return a users count for organisation the meta', async () => {
    const endpoint = `/v2/organisations/${organisationA.id}/users`;
    const { result: { meta } } = await getRequest(endpoint, users[0].token);

    assert.equal(meta.pagination.total_count, 4);
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

  it('should not return deleted users', async () => {
    // First remove a user from the organisation
    await organisationRepo.updateOrganisationLink({
      organisationId: organisationA.id,
      userId: users[0].id,
    }, { deletedAt: new Date() });

    const endpoint = `/v2/organisations/${organisationA.id}/users`;
    const { result } = await getRequest(endpoint, users[0].token);

    // 1 user is in a different organisation and 1 was deleted, so we should get users.length - 2
    assert.lengthOf(result.data, users.length - 2);
  });

  describe('Filtering', () => {
    it('should only search for users that are member of the organisation', async () => {
      const endpoint = `/v2/organisations/${organisationA.id}/users?q=pel`;
      const { statusCode, result } = await getRequest(endpoint, users[0].token);

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 1);
    });

    it('should handle just text query', async () => {
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

    it('should handle spaces', async () => {
      const endpoint = `/v2/organisations/${organisationA.id}/users?q=n%20D`;
      const { statusCode, result } = await getRequest(endpoint, users[0].token);

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 1);
    });

    it('should handle hyphens', async () => {
      const endpoint = `/v2/organisations/${organisationA.id}/users?q=n-c`;
      const { statusCode, result } = await getRequest(endpoint, users[0].token);

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 1);
      assert.equal(result.data[0].first_name, 'Jean-Claude');
    });

    it('should only search for users that are admins of the organisation', async () => {
      const endpoint = `/v2/organisations/${organisationA.id}/users?select=${ESEARCH_SELECTORS.ADMIN}`;
      const { statusCode, result } = await getRequest(endpoint, users[0].token);

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 3);
    });

    it('should only search for users that are inactive users of the organisation', async () => {
      const endpoint = `/v2/organisations/${organisationA.id}/users?select=${ESEARCH_SELECTORS.INACTIVE}`;
      const { statusCode, result } = await getRequest(endpoint, users[0].token);

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 3);
    });

    it('should only search for users that are active users of the organisation', async () => {
      const endpoint = `/v2/organisations/${organisationA.id}/users?select=${ESEARCH_SELECTORS.ACTIVE}`;
      const { statusCode, result } = await getRequest(endpoint, users[0].token);

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 1);
    });

    it('should only search for users that are not activated users of the organisation', async () => {
      const endpoint = `/v2/organisations/${organisationA.id}/users?select=${ESEARCH_SELECTORS.NOT_ACTIVATED}`;
      const { statusCode, result } = await getRequest(endpoint, users[0].token);

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 2);
    });
  });
});
