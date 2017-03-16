const nock = require('nock');
const { assert } = require('chai');
const { getRequest } = require('../../../shared/test-utils/request');
const testHelper = require('../../../shared/test-utils/helpers');
const stubs = require('../../integrations/adapters/pmt/test-utils/stubs');

describe('Available users for shift', () => {
  let admin;
  let network;
  let plainNetwork;
  let fakeUsers;

  before(async () => {
    const adminExternalId = '8023';
    const [user, employee] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
    ]);
    admin = user;
    const { network: netw } = await testHelper.createNetworkWithIntegration({
      userId: admin.id,
      externalId: 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi',
      name: 'flexappeal',
      integrationName: 'PMT',
      integrationToken: 'foobar',
      userExternalId: adminExternalId,
      userToken: '379ce9b4176cb89354c1f74b3a2c1c7a',
    });
    network = netw;
    await testHelper.addUserToNetwork({
      userId: employee.id,
      networkId: network.id,
    });
    plainNetwork = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    fakeUsers = [{
      id: adminExternalId,
      first_name: admin.firstName,
      last_name: admin.lastName,
    }, {
      id: '3',
      first_name: 'I dont',
      last_name: 'Exist',
    }];
  });

  afterEach(() => nock.cleanAll());

  after(() => testHelper.cleanAll());

  it('should return available users that are member of the network', async () => {
    nock(network.externalId)
      .get('/shift/1/available')
      .reply(200, { users: fakeUsers });

    const endpoint = `/v2/networks/${network.id}/shifts/1/available`;
    const { result, statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data[0].external_id, '8023');
    assert.equal(result.data[0].id, admin.id);
  });

  it('should fail when shift is not found', async () => {
    const shiftId = 2;

    nock(network.externalId)
      .get(`/shift/${shiftId}/available`)
      .reply(404, stubs.available_users_not_found_404);

    const endpoint = `/v2/networks/${network.id}/shifts/${shiftId}/available`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 404);
  });

  it('should fail when network has no integration', async () => {
    nock(network.externalId)
      .get('/shift/1/available')
      .reply(200, { users: fakeUsers });
    const endpoint = `/v2/networks/${plainNetwork.id}/shifts/1/available`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 403);
  });
});
