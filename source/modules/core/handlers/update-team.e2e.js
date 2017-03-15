import { assert } from 'chai';
import blueprints from '../../../shared/test-utils/blueprints';
import * as testHelper from '../../../shared/test-utils/helpers';
import { putRequest } from '../../../shared/test-utils/request';
import * as teamService from '../services/team';
import * as teamRepository from '../repositories/team';

describe('Handler: update team', () => {
  let network;
  let createdTeam;
  let employee;
  let admin;

  before(async () => {
    admin = await testHelper.createUser({ password: 'pw' });
    network = await testHelper.createNetwork({ userId: admin.id });
    employee = await testHelper.createUser(blueprints.users.employee);

    await testHelper.addUserToNetwork(
        { networkId: network.id, userId: admin.id, roleType: 'ADMIN' });

    await teamRepository.create({
      name: 'Cool team', networkId: network.id });
    createdTeam = await teamService.create({
      name: 'Foo team',
      networkId: network.id,
      userIds: [admin.id],
      isChannel: true,
    }, { credentials: { id: admin.id } });
  });

  after(async () => {
    await testHelper.deleteUser(employee);

    return testHelper.deleteUser(admin);
  });

  it('should update an existing team', async () => {
    const endpoint = `/v2/networks/${network.id}/teams/${createdTeam.id}`;
    const payload = { name: 'Updated foo team', is_channel: true };
    const { statusCode, result } = await putRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.type, 'team');
    assert.equal(result.data.network_id, network.id);
    assert.equal(result.data.name, 'Updated foo team');
    assert.equal(result.data.member_count, 1);
    assert.equal(result.data.is_channel, true);
    assert.equal(result.data.is_member, true);
    assert.equal(result.data.is_synced, false);
    assert.deepEqual(result.data.member_ids, [admin.id]);
  });

  it('should reset the user based on the user_ids value', async () => {
    const endpoint = `/v2/networks/${network.id}/teams/${createdTeam.id}`;
    const payload = { user_ids: [employee.id] };
    const { statusCode, result } = await putRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.type, 'team');
    assert.equal(result.data.network_id, network.id);
    assert.equal(result.data.name, 'Updated foo team');
    assert.equal(result.data.member_count, 1);
    assert.equal(result.data.is_channel, true);
    assert.deepEqual(result.data.member_ids, [employee.id]);
  });

  it('should return 403 if user is not an admin', async () => {
    const endpoint = `/v2/networks/${network.id}/teams/${createdTeam.id}`;
    const payload = { name: 'Updated again foo team' };
    const { statusCode } = await putRequest(endpoint, payload, employee.token);

    assert.equal(statusCode, 403);
  });

  it('should return 404 when team is not found', async () => {
    const endpoint = `/v2/networks/${network.id}/teams/58429831828`;
    const payload = { name: 'Updated again foo team' };
    const { statusCode } = await putRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 404);
  });
});
