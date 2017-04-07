const { assert } = require('chai');
const testHelpers = require('../../../shared/test-utils/helpers');
const organisationService = require('../services/organisation');
const { getRequest } = require('../../../shared/test-utils/request');

describe.only('Handler: Organisations for user', () => {
  let organisationA;
  let organisationB;
  let user;

  before(async () => {
    [organisationA, organisationB, user] = await Promise.all([
      testHelpers.createOrganisation(),
      testHelpers.createOrganisation(),
      testHelpers.createUser(),
    ]);

    const [networkA, networkB] = await Promise.all([
      testHelpers.createNetwork({ userId: user.id }),
      testHelpers.createNetwork({ userId: user.id }),
    ]);

    await Promise.all([
      organisationService.attachNetwork({
        networkId: networkA.id, organisationId: organisationA.id }),
      organisationService.attachNetwork({
        networkId: networkB.id, organisationId: organisationA.id }),
      testHelpers.addUserToOrganisation(user.id, organisationA.id, 'ADMIN'),
      testHelpers.addUserToOrganisation(user.id, organisationB.id, 'EMPLOYEE'),
    ]);
  });

  after(() => testHelpers.cleanAll());

  it('should return organisations for user', async () => {
    const endpoint = '/v2/users/me/organisations';
    const { result } = await getRequest(endpoint, user.token);

    assert.lengthOf(result.data, 2);
  });

  it('should include networks via query parameter', async () => {
    const endpoint = '/v2/users/me/organisations?include=networks';
    const { result } = await getRequest(endpoint, user.token);

    assert.lengthOf(result.data, 2);
    assert.lengthOf(result.data.find((o) => o.id === organisationA.id).networks, 2);
  });
});
