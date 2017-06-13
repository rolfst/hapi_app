const { assert } = require('chai');
const R = require('ramda');
const testHelpers = require('../../../shared/test-utils/helpers');
const responseUtils = require('../../../shared/utils/response');
const { postRequest } = require('../../../shared/test-utils/request');
const organisationService = require('../../core/services/organisation');
const { ERoleTypes } = require('../../core/definitions');

describe('Handler: Invite user to organisation', () => {
  let admin;
  let organisation;
  let adminOtherNetwork;
  let existingEmployee;
  let badguy;
  let networkA;
  let networkB;

  before(async () => {
    [organisation, admin, adminOtherNetwork, existingEmployee, badguy] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createUser({ username: 'admin@flex-appeal.nl' }),
      testHelpers.createUser(),
      testHelpers.createUser(),
      testHelpers.createUser(),
    ]);

    [networkA, networkB] = await Promise.all([
      testHelpers.createNetwork({ userId: admin.id, name: 'flexAppeal' }),
      testHelpers.createNetwork({ userId: adminOtherNetwork.id, name: 'flexAppeal2' }),
    ]);
    await Promise.all([
      organisationService.attachNetwork({
        networkId: networkA.id, organisationId: organisation.id }),
      organisationService.attachNetwork({
        networkId: networkB.id, organisationId: organisation.id }),
      testHelpers.addUserToOrganisation(admin.id, organisation.id, ERoleTypes.ADMIN),
      testHelpers.addUserToOrganisation(existingEmployee.id, organisation.id),
      testHelpers.addUserToNetwork({ networkId: networkB.id, userId: existingEmployee.id }),
    ]);
  });

  after(() => testHelpers.cleanAll());

  const user = {
    first_name: 'Foo',
    last_name: 'Baz',
  };

  it('should not add to the organisation as non-organisation admin', async () => {
    const payload = R.mergeAll([
      user,
      { email: 'admin@baz.com', role_type: 'admin' },
      { networks: [{ id: networkA.id, role_type: 'employee' }] },
    ]);

    const endpoint = `/v2/organisations/${organisation.id}/users`;
    const { statusCode } = await postRequest(endpoint, payload, badguy.token);

    assert.equal(statusCode, 403);
  });

  it('should add to the organisation as admin', async () => {
    const payload = R.merge(
      user,
      { email: 'admin@baz.com',
        role_type: 'admin',
        networks: [{ id: networkA.id, role_type: 'employee' }],
      }
    );

    const endpoint = `/v2/organisations/${organisation.id}/users`;
    const { result, statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.email, payload.email);
    const actualOrganisation = result.data.scopes.organisations[0];
    assert.equal(actualOrganisation.role_type, payload.role_type.toUpperCase());
    assert.isString(actualOrganisation.invited_at);
    const actualNetwork = result.data.scopes.networks[0];
    assert.equal(actualNetwork.role_type, ERoleTypes.EMPLOYEE);
    assert.equal(actualNetwork.role_type, payload.networks[0].role_type.toUpperCase());
    assert.isString(actualNetwork.invited_at);
  });

  it('should add to the organisation as employee', async () => {
    const payload = R.mergeAll([
      user,
      { email: 'employee@baz.com', role_type: 'employee' },
      { networks: [{ id: networkA.id, role_type: 'employee' }] },
    ]);

    const endpoint = `/v2/organisations/${organisation.id}/users`;
    const { result, statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.username, payload.email);
    assert.equal(result.data.email, payload.email);
    const actualOrganisation = result.data.scopes.organisations[0];
    assert.equal(actualOrganisation.role_type, payload.role_type.toUpperCase());
    const actualNetwork = result.data.scopes.networks[0];
    assert.equal(actualNetwork.role_type, payload.networks[0].role_type.toUpperCase());
  });

  it('should return with 200 when user is invited but already exists in the system', async () => {
    const payload = responseUtils.toSnakeCase(
      R.pick(['firstName', 'lastName', 'email', 'networks', 'role_type'],
        R.mergeAll([
          existingEmployee,
          { role_type: 'employee' },
          { networks: [{ id: networkA.id, role_type: 'employee' }] },
        ])
      )
    );

    const endpoint = `/v2/organisations/${organisation.id}/users`;
    const { statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 200);
  });
});
