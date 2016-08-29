import nock from 'nock';
import { assert } from 'chai';
import addNetworkScope from 'common/utils/add-network-scope';
import { getRequest } from 'common/test-utils/request';

describe('Available users for shift', () => {
  before(async () => {
    await global.networks.pmt.addUser(global.users.employee);

    const fakeUsers = [{
      id: global.users.employee.id,
      email: global.users.employee.email,
    }, {
      id: global.users.admin.id,
      email: global.users.admin.email,
    }, {
      id: 3,
      email: 'nonexistinguser@flex-appeal.nl',
    }];

    nock(global.networks.pmt.externalId)
      .get('/shift/1/available')
      .reply(200, { users: fakeUsers });
  });

  it('should return available users', async () => {
    const endpoint = `/v2/networks/${global.networks.pmt.id}/shifts/1/available`;
    const { result } = await getRequest(endpoint);

    const [newEmployee, newAdmin] = await Promise.all([
      global.users.employee.reload(),
      global.users.admin.reload(),
    ]);

    assert.deepEqual(result.data, [
      addNetworkScope(newEmployee, global.networks.pmt.id).toJSON(),
      addNetworkScope(newAdmin, global.networks.pmt.id).toJSON(),
    ]);
  });

  it('should fail when network has no integration', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/shifts/1/available`;
    const { statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 403);
  });
});
