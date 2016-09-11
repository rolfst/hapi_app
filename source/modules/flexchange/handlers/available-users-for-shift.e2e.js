import nock from 'nock';
import { assert } from 'chai';
import * as networkUtil from 'common/utils/network';
import { getRequest } from 'common/test-utils/request';

describe.only('Available users for shift', () => {
  before(async () => {
    await global.networks.pmt.addUser(global.users.employee);

    const adminExternalId = '8023';

    const fakeUsers = [{
      id: adminExternalId,
      first_name: global.users.admin.firstName,
      last_name: global.users.admin.lastName,
    }, {
      id: '3',
      first_name: 'I dont',
      last_name: 'Exist',
    }];

    nock(global.networks.pmt.externalId)
      .get('/shift/1/available')
      .reply(200, { users: fakeUsers });
  });

  it('should return available users', async () => {
    const endpoint = `/v2/networks/${global.networks.pmt.id}/shifts/1/available`;
    const { result, statusCode } = await getRequest(endpoint);

    const newAdmin = await global.users.admin.reload();

    assert.equal(statusCode, 200);
    assert.deepEqual(result.data, [
      networkUtil.addUserScope(newAdmin, global.networks.pmt.id).toJSON(),
    ]);
  });

  it('should fail when shift is not found', async () => {
    const endpoint = `/v2/networks/${global.networks.pmt.id}/shifts/2/available`;
    const { statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 404);
  });

  it('should fail when network has no integration', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/shifts/1/available`;
    const { statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 403);
  });
});
