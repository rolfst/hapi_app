import nock from 'nock';
import { assert } from 'chai';
import { getRequest } from '../../../shared/test-utils/request';
import * as stubs from '../../../adapters/pmt/test-utils/stubs';
import * as networkRepo from '../../core/repositories/network';
import * as userRepo from '../../core/repositories/user';

describe('Available users for shift', () => {
  before(async () => {
    await networkRepo.addUser({
      userId: global.users.employee.id,
      networkId: global.networks.pmt.id,
    });

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

  after(() => userRepo.removeFromNetwork(global.users.employee.id, global.networks.pmt.id));

  it('should return available users that are member of the network', async () => {
    const endpoint = `/v2/networks/${global.networks.pmt.id}/shifts/1/available`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 200);
    assert.equal(result.data[0].external_id, '8023');
    assert.equal(result.data[0].id, global.users.admin.id);
  });

  it('should fail when shift is not found', async () => {
    const shiftId = 2;

    nock(global.networks.pmt.externalId)
      .get(`/shift/${shiftId}/available`)
      .reply(404, stubs.available_users_not_found_404);

    const endpoint = `/v2/networks/${global.networks.pmt.id}/shifts/${shiftId}/available`;
    const { statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 404);
  });

  it('should fail when network has no integration', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/shifts/1/available`;
    const { statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 403);
  });
});
